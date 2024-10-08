import { hash } from 'bcrypt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

const ClientSchema = z.object({
	nome: z.string(),
	email: z.string(),
	senha: z.string(),
	telefone: z.string(),
	endereco: z.string(),
	tipo: z.literal('CLIENTE'),
})

type BodySchema = z.infer<typeof ClientSchema>

export class ClienteController {
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema

			const userHasExists = await prisma.usuario.findFirst({
				where: {
					email: data.email,
				},
			})

			if (data.tipo === 'CLIENTE' && !userHasExists) {
				const hashedPassword = await hash(data.senha, 6)

				const client = await prisma.cliente.create({
					data: {
						endereco: data.endereco,
						telefone: data.telefone,
						usuario: {
							create: {
								nome: data.nome,
								email: data.email,
								tipo: data.tipo,
								senha: hashedPassword,
							},
						},
					},
					select: {
						id_cliente: true,
						telefone: true,
						endereco: true,
						usuario: {
							select: {
								id_usuario: true,
								nome: true,
								email: true,
								tipo: true,
								created_at: true,
							},
						},
					},
				})

				return res.send(client)
			}

			if (userHasExists) {
				return res.status(400).send({
					error: 'This email is already in use',
				})
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
			if (token === undefined)
				return res.status(401).send({ error: 'Unauthorized' })

			const decoded = (await req.jwtVerify()) as { id: string }

			const userLogged = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
					OR: [
						{
							tipo: 'ADMIN',
						},
						{
							tipo: 'FUNCIONARIO',
						},
					],
				},
			})

			if (userLogged) {
				const clients = await prisma.cliente.findMany({
					where: { usuario: { tipo: 'CLIENTE' } },
					select: {
						id_cliente: true,
						telefone: true,
						endereco: true,
						usuario: {
							select: {
								id_usuario: true,
								nome: true,
								email: true,
								tipo: true,
								created_at: true,
							},
						},
					},
				})
				if (clients.length === 0)
					return res.send({ message: 'No clients found' })
				return res.status(200).send(clients)
			}
			return res.status(401).send({
				error: 'Only administrators or employees can view client list',
			})
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema

			const decoded = (await req.jwtVerify()) as {
				id: string
				id_cliente: string
			}

			// Verifica se o id do token corresponde ao id do cliente
			const userLogged = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
					AND: [
						{
							cliente: {
								id_cliente: decoded.id_cliente,
							},
						},
					],
				},
			})

			console.log(userLogged)

			if (!userLogged) {
				return res.status(401).send({ error: 'Unauthorized' })
			}

			if (userLogged) {
				await prisma.cliente
					.update({
						where: {
							id_cliente: decoded.id_cliente,
						},
						data: {
							usuario: {
								update: {
									data: {
										nome: data.nome,
										email: data.email,
										tipo: data.tipo,
									},
								},
							},
							telefone: data.telefone,
							endereco: data.endereco,
						},
					})
					.then((client) => {
						return res.send(client)
					})
					.catch((error) => {
						return res.status(400).send({
							error: error.message,
						})
					})
			}
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const decodedUser = (await req.jwtVerify()) as { id: string }
			const { id_cliente } = req.params as { id_cliente: string }

			// Verifica se o id_cliente foi passado corretamente
			if (!id_cliente) {
				return res.status(400).send({
					error: 'Client ID is required',
				})
			}

			const client = await prisma.usuario.findFirst({
				where: {
					id_usuario: decodedUser.id, // Verifica se o id do token corresponde ao id_usuario
					cliente: {
						id_cliente, // Verifica se o cliente é dono da conta
					},
				},
			})

			if (!client) {
				return res.status(403).send({
					error: 'Client not found',
				})
			}

			await prisma
				.$transaction(async (prisma) => {
					// Deletar o cliente vinculado
					await prisma.cliente.delete({
						where: { id_cliente },
					})

					// Deletar o usuário vinculado ao cliente
					await prisma.usuario.delete({
						where: { id_usuario: decodedUser.id },
					})
				})
				.then(() => {
					return res.send({
						message: 'Client deleted successfully',
					})
				})

			return res.status(403).send({
				error: 'You do not have permission to delete this client',
			})
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
