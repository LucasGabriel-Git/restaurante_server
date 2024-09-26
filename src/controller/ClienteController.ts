import { tipo } from '@prisma/client'
import { hash } from 'bcrypt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

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

			const userHasExists = await prisma.cliente.findFirst({
				where: {
					usuario: {
						email: data.email,
					},
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

			return res.status(400).send({
				error: 'This email is already in use',
			})
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
			const decodedUser = (await req.jwtVerify()) as {
				id: string
				id_cliente: string
			}
			console.log(decodedUser)

			const isClient = await prisma.cliente.findFirst({
				where: {
					id_cliente: decodedUser.id_cliente,
					AND: [
						{
							usuario: {
								tipo: 'CLIENTE',
							},
						},
					],
				},
			})

			if (isClient) {
				await prisma.cliente
					.delete({
						where: {
							id_cliente: isClient.id_cliente,
						},
					})
					.then(() => {
						return res.send({
							message: 'Client deleted',
						})
					})
					.catch((error) => {
						return res.status(400).send({ error: error.message })
					})
			}

			return res.status(400).send({ error: 'Client not found' })
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
