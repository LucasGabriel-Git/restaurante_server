import { compareSync, hash } from 'bcrypt'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../client/prisma'

const bodySchema = z.object({
	nome: z.string(),
	email: z.string().email(),
	senha: z.string(),
	tipo: z.enum(['CLIENTE', 'FUNCIONARIO', 'ADMIN']),
})

type BodySchema = z.infer<typeof bodySchema>
export class UsuarioController {
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema
			const userHasExists = await prisma.usuario.findUnique({
				where: {
					email: data.email,
				},
			})

			if (userHasExists)
				return res.status(400).send({ error: 'User already exists' })

			const passwordHash = await hash(data.senha, 6)

			const user = await prisma.usuario.create({
				data: {
					...data,
					tipo: data.tipo,
					senha: passwordHash,
				},
			})
			return res.send(user)
		} catch (error) {
			if (error instanceof Error) {
				console.log(error.message)
			}
		}
	}

	async list(req: FastifyRequest, res: FastifyReply) {
		try {
			const decoded = (await req.jwtVerify()) as { id: string }

			const userLogged = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
				},
			})
			console.log(decoded)

			const users = await prisma.usuario.findMany({
				select: {
					id_usuario: true,
					nome: true,
					email: true,
					tipo: true,
					created_at: true,
					updated_at: true,
				},
			})

			if (userLogged?.tipo === 'ADMIN' || userLogged?.tipo === 'FUNCIONARIO') {
				return res.send({ users })
			}

			if (userLogged?.tipo === 'CLIENTE' && users.length > 0) {
				return res.status(401).send({ error: 'Unauthorized' })
			}
			if (users.length === 0) {
				return res.send({ message: 'No users found' })
			}
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema
			const { id } = req.params as { id: string }

			const passwordHashed = await hash(data.senha, 6)

			const user = await prisma.usuario.update({
				where: {
					id_usuario: id,
				},
				data: {
					...data,
					tipo: data.tipo,
					senha: passwordHashed,
				},
			})
			return res.send(user)
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			await prisma.usuario.delete({
				where: {
					id_usuario: id,
				},
			})
			return res.send({
				message: 'User deleted',
			})
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async login(req: FastifyRequest, res: FastifyReply) {
		try {
			const { email, senha } = req.body as BodySchema

			const user = await prisma.usuario.findUnique({
				where: {
					email,
				},
				include: {
					cliente: true,
				},
			})

			if (!user) {
				return res.status(400).send({ error: 'User not found' })
			}

			if (!compareSync(senha, String(user.senha))) {
				return res.status(400).send({ error: 'Invalid password' })
			}

			const token = await res.jwtSign(
				{
					id: user.id_usuario,
					nome: user.nome,
					id_cliente: user.cliente?.id_cliente,
				},
				{
					expiresIn: '2h',
				},
			)

			return res.send({ token })
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async getUserLogged(req: FastifyRequest, res: FastifyReply) {
		try {
			const decoded = (await req.jwtVerify()) as { id: string }

			const user = await prisma.usuario.findFirst({
				where: {
					id_usuario: decoded.id,
				},
				select: {
					id_usuario: true,
					nome: true,
					email: true,
					tipo: true,
					created_at: true,
					cliente: {
						select: {
							id_cliente: true,
						},
					},
				},
			})

			if (!user) {
				return res.status(400).send({ error: 'User not found' })
			}

			return res.send(user)
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
