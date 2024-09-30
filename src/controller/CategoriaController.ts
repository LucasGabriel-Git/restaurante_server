import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

const bodySchema = z.object({
	nome: z.string(),
})

const paramsSchema = z.object({
	id: z.string(),
})

type BodySchema = z.infer<typeof bodySchema>
type ParamsSchema = z.infer<typeof paramsSchema>

export class CategoriaController {
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema
			const payload = (await req.jwtDecode()) as { id: string }

			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: payload.id,
					OR: [{ tipo: 'ADMIN' }, { tipo: 'FUNCIONARIO' }],
				},
			})
			if (!userHasPermission) {
				return res.status(401).send({
					error: 'Unauthorized',
				})
			}

			const category = await prisma.categoria.findFirst({
				where: {
					nome: data.nome,
				},
			})

			if (category !== null) {
				return res.status(400).send({
					error: 'Category already exists',
				})
			}

			const newCategory = await prisma.categoria.create({
				data: {
					nome: data.nome,
				},
			})

			return res.send(newCategory)
		} catch (error) {}
	}

	async update(req: FastifyRequest, res: FastifyReply) {}

	async delete(req: FastifyRequest, res: FastifyReply) {}

	async list(req: FastifyRequest, res: FastifyReply) {
		try {
			const payload = (await req.jwtDecode()) as { id: string }

			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: payload.id,
					OR: [{ tipo: 'ADMIN' }, { tipo: 'FUNCIONARIO' }],
				},
			})

			if (!userHasPermission) {
				return res.status(401).send({
					error: 'Unauthorized',
				})
			}

			// const categories =
			return res.send(await prisma.categoria.findMany())
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async get(req: FastifyRequest, res: FastifyReply) {}
}
