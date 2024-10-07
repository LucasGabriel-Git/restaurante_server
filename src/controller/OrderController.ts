import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

const OrderItensSchema = z.object({
	id_produto: z.string(),
	id_pedido: z.string(),
	quantidade: z.coerce.number(),
	preco_unit: z.coerce.number(),
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

			const data = req.body as BodySchema

			if (token !== undefined) {
				const valorTotal = data.itens_pedido.reduce((acc, i) => {
					return acc + i.quantidade * i.preco_unit
				}, 0)

				const newOrder = await prisma.pedido.create({
					data: {
						id_cliente: data.id_cliente,
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
				include: {
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
				const orderStatus = await prisma.pedido.findUnique({
					where: {
						id_pedido: body.id_pedido,
					},
					select: {
						status: true,
					},
				})
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
	// update()
	// delete()
	// getById()
	// getByCliente()
	// getByFuncionario()
}
