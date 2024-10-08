import dayjs from 'dayjs'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'
import ptBR from 'dayjs/locale/pt-br'
import type { Decimal } from '@prisma/client/runtime/library'

dayjs.locale(ptBR)

const OrderItensSchema = z.object({
	id_produto: z.string(),
	id_pedido: z.string(),
	quantidade: z.coerce.number(),
	preco_unit: z.coerce.number(),
	tempo_preparo: z.coerce.number(),
})

const OrderFormSchema = z.object({
	data_hora: z.string(),
	id_cliente: z.string(),
	id_funcionario: z.string(),
	status: z.enum(['PENDENTE', 'FINALIZADO', 'CANCELADO']).default('PENDENTE'),
	valor_total: z.coerce.number(),
	itens_pedido: z.array(OrderItensSchema).default([]),
})

type BodySchema = z.infer<typeof OrderFormSchema>

export class OrderController {
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}

			const decoded = (await req.jwtVerify()) as {
				id: string
				id_cliente: string
			}

			const userLogged = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
				},
				select: {
					cliente: {
						select: {
							id_cliente: true,
						},
					},
					tipo: true,
				},
			})

			const data = req.body as BodySchema

			if (token !== undefined) {
				const valorTotal = data.itens_pedido.reduce((acc, i) => {
					return acc + i.quantidade * i.preco_unit
				}, 0)

				const products: ({
					nome: string
					id_produto: string
					descricao: string | null
					preco: Decimal | null
					id_categoria: string | null
					tempo_preparo: number | null
					id_estoque: string | null
				} | null)[] = []
				for (const item of data.itens_pedido) {
					await prisma.produto
						.findFirst({
							where: {
								id_produto: item.id_produto,
							},
						})
						.then((res) => {
							products.push(res)
						})
				}

				const tempoPreparo = products.reduce((acc, i) => {
					return acc + Number(i?.tempo_preparo)
				}, 0)

				const newOrder = await prisma.pedido.create({
					data: {
						id_cliente: userLogged
							? userLogged.cliente?.id_cliente
							: data.id_cliente,
						id_funcionario: data.id_funcionario,
						data_hora: data.data_hora,
						itens_pedido: {
							create: data.itens_pedido.map((item) => ({
								id_produto: item.id_produto,
								preco_unit: item.preco_unit,
								quantidade: item.quantidade,
							})),
						},
						valor_total: valorTotal,
						tempo_preparo_total: tempoPreparo,
					},
				})

				if (newOrder) {
					return res.send(newOrder)
				}

				return res.status(400).send({ error: 'Order not created' })
			}
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async list(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization

			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}

			const orders = await prisma.pedido.findMany({
				select: {
					id_pedido: true,
					numero_pedido: true,
					tempo_preparo_total: true,
					cliente: {
						select: {
							id_cliente: true,
							usuario: {
								select: {
									nome: true,
								},
							},
						},
					},
					valor_total: true,
					data_hora: true,
					status: true,
					itens_pedido: {
						select: {
							id_itens_pedido: true,
							produto: {
								select: {
									nome: true,
									descricao: true,
									preco: true,
								},
							},
							quantidade: true,
							preco_unit: true,
						},
					},
				},
				distinct: 'id_pedido',
			})

			return res.send(orders)
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async updateStatus(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}
			const body = req.body as { id_pedido: string }

			if (body.id_pedido) {
				const decoded = (await req.jwtVerify()) as {
					id: string
				}

				const useLogged = await prisma.usuario.findUnique({
					where: {
						id_usuario: decoded.id,
					},
					select: {
						tipo: true,
					},
				})

				const orderStatus = await prisma.pedido.findUnique({
					where: {
						id_pedido: body.id_pedido,
					},
					select: {
						status: true,
					},
				})

				if (useLogged?.tipo !== 'ADMIN' && useLogged?.tipo !== 'FUNCIONARIO') {
					return res.status(401).send({ error: 'Access denied' })
				}

				if (orderStatus?.status === 'CANCELADO') {
					return res.status(400).send({ error: 'This order was canceled' })
				}

				if (orderStatus?.status === 'FINALIZADO') {
					return res.status(400).send({ error: 'Order already finalized' })
				}

				const updatedOrder = await prisma.pedido.update({
					where: {
						id_pedido: body.id_pedido,
					},
					data: {
						status: 'FINALIZADO',
					},
					select: {
						data_hora: true,
						id_pedido: true,
						status: true,
						itens_pedido: {
							select: {
								id_itens_pedido: true,
								produto: {
									select: {
										nome: true,
										descricao: true,
										preco: true,
									},
								},
								quantidade: true,
								preco_unit: true,
							},
						},
						valor_total: true,
						cliente: {
							select: {
								id_cliente: true,
								usuario: {
									select: {
										nome: true,
									},
								},
							},
						},
					},
				})

				if (updatedOrder) {
					return res.send(updatedOrder)
				}

				return res.status(400).send({ error: 'Order not updated' })
			}
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async cancelOrder(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}
			const body = req.body as { id_pedido: string }

			if (body.id_pedido) {
				const orderStatus = await prisma.pedido.findUnique({
					where: {
						id_pedido: body.id_pedido,
					},
					select: {
						status: true,
					},
				})
				if (orderStatus?.status === 'CANCELADO') {
					return res.status(400).send({ error: 'Order already canceled' })
				}
				const updatedOrder = await prisma.pedido.update({
					where: {
						id_pedido: body.id_pedido,
					},
					data: {
						status: 'CANCELADO',
					},
					select: {
						data_hora: true,
						id_pedido: true,
						status: true,
						itens_pedido: {
							select: {
								id_itens_pedido: true,
								produto: {
									select: {
										nome: true,
										descricao: true,
										preco: true,
									},
								},
								quantidade: true,
								preco_unit: true,
							},
						},
						valor_total: true,
						cliente: {
							select: {
								id_cliente: true,
								usuario: {
									select: {
										nome: true,
									},
								},
							},
						},
					},
				})

				if (updatedOrder) {
					return res.send(updatedOrder)
				}

				return res.status(400).send({ error: 'Order not updated' })
			}
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async findById(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) return res.status(401).send({ error: "Token's missing" })

			const { id } = req.params as { id: string }

			const order = await prisma.pedido.findUnique({
				where: {
					id_pedido: id,
				},
				select: {
					id_pedido: true,
					numero_pedido: true,
					tempo_preparo_total: true,
					cliente: {
						select: {
							id_cliente: true,
							usuario: {
								select: {
									nome: true,
								},
							},
						},
					},
					valor_total: true,
					data_hora: true,
					status: true,
					itens_pedido: {
						select: {
							id_itens_pedido: true,
							produto: {
								select: {
									nome: true,
									descricao: true,
									preco: true,
								},
							},
							quantidade: true,
							preco_unit: true,
						},
						distinct: 'id_pedido',
					},
				},
			})

			return res.send(order)
		} catch (error) {
			if (error instanceof Error)
				return res.status(400).send({ error: error.message })
		}
	}
	async getByCliente(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}

			const decoded = (await req.jwtVerify()) as { id: string }

			const userLogged = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
				},
				select: {
					id_usuario: true,
					tipo: true,
					cliente: {
						select: {
							id_cliente: true,
						},
					},
				},
			})

			let whereCondition = {}

			if (userLogged?.tipo === 'CLIENTE') {
				whereCondition = {
					id_cliente: userLogged?.cliente?.id_cliente,
				}
			} else if (
				userLogged?.tipo === 'FUNCIONARIO' ||
				userLogged?.tipo === 'ADMIN'
			) {
				whereCondition = {}
			} else {
				return res.status(401).send({ error: 'Access denied' })
			}

			const orders = await prisma.pedido.findMany({
				where: whereCondition,
				select: {
					id_pedido: true,
					numero_pedido: true,
					tempo_preparo_total: true,
					cliente: {
						select: {
							id_cliente: true,
							usuario: {
								select: {
									nome: true,
								},
							},
						},
					},
					valor_total: true,
					data_hora: true,
					status: true,
					itens_pedido: {
						select: {
							id_itens_pedido: true,
							produto: {
								select: {
									nome: true,
									descricao: true,
									preco: true,
								},
							},
							quantidade: true,
							preco_unit: true,
						},
					},
				},
				distinct: 'id_pedido',
			})

			if (orders) {
				return res.send(orders)
			}

			return res.status(400).send({ error: 'Orders not found for this client' })
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
	async getTotalOrdersinMonth(req: FastifyRequest, res: FastifyReply) {
		try {
			const token = req.headers.authorization
			if (!token) {
				return res.status(401).send({ error: 'Unauthorized' })
			}

			const decoded = (await req.jwtVerify()) as { id: string }
			const userLogged = await prisma.usuario.findUnique({
				where: {
					id_usuario: decoded.id,
				},
				select: {
					tipo: true,
				},
			})

			if (userLogged?.tipo !== 'ADMIN' && userLogged?.tipo !== 'FUNCIONARIO') {
				return res.status(401).send({ error: 'Access denied' })
			}

			const startMonth = dayjs().startOf('month').startOf('day').format('D')
			const endMonth = dayjs().endOf('month').day(4).format('D')

			const orders = await prisma.pedido.aggregate({
				_sum: {
					valor_total: true,
				},
				where: {
					data_hora: {
						gte: startMonth,
						lte: endMonth,
					},
				},
			})

			return res.send(orders)
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
