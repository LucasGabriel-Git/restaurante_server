import { hash } from 'bcrypt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'
import PDFDocument from 'pdfkit'

const ClientSchema = z.object({
	nome: z.string().min(1, 'Nome é obrigatório'),
	email: z.string().email('Email inválido'),
	senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
	telefone: z.string().min(1, 'Telefone é obrigatório'),
	endereco: z.string().min(1, 'Endereço é obrigatório'),
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

			console.log(userHasExists)

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

			if (clients.length === 0) return res.send({ message: 'No clients found' })

			return res.send(clients)
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema
		} catch (error) {}
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
