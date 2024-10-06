import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

const DataSchema = z.object({
	nome: z.string(),
	descricao: z.string(),
	preco: z.coerce.number(),
	id_categoria: z.string(),
	quantidade: z.number(),
})

type IProduto = z.infer<typeof DataSchema>

export class ProdutosController {
	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as IProduto
			const payload = (await req.jwtDecode()) as { id: string }
			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: payload.id,
					AND: [
						{
							OR: [
								{
									tipo: 'ADMIN',
								},
								{
									tipo: 'FUNCIONARIO',
								},
							],
						},
					],
				},
			})
			if (!userHasPermission) {
				return res.code(401).send({ message: 'Unauthorized' })
			}

			if (userHasPermission) {
				const hasProduct = await prisma.produto.findFirst({
					where: {
						nome: data.nome,
					},
				})

				if (hasProduct)
					return res.status(409).send({ message: 'Product already exists' })

				await prisma.produto
					.create({
						data: {
							nome: data.nome,
							descricao: data.descricao,
							preco: data.preco,
							categoria: {
								connect: {
									id_categoria: data.id_categoria,
								},
							},
						},
					})
					.then(async (_p) => {
						await prisma.estoque
							.create({
								data: {
									quantidade: data.quantidade,
									id_produto: _p.id_produto,
								},
							})
							.then((_) => {
								return res
									.code(201)
									.send({ message: 'Product created successfully' })
							})
					})
					.catch((er) => {
						console.log(er)
						return res.code(500).send({ message: 'Error creating product' })
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
			const payload = (await req.jwtDecode()) as { id: string }

			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: payload.id,
					AND: [
						{
							OR: [
								{
									tipo: 'ADMIN',
								},
								{
									tipo: 'FUNCIONARIO',
								},
							],
						},
					],
				},
			})

			if (userHasPermission)
				return res.status(200).send(
					await prisma.produto.findMany({
						select: {
							nome: true,
							descricao: true,
							preco: true,
							categoria: {
								select: {
									id_categoria: true,
									nome: true,
								},
							},
							estoque: {
								select: {
									quantidade: true,
								},
							},
						},
					}),
				)

			if (!userHasPermission)
				return res.status(401).send({ error: 'Unauthorized' })
		} catch (err) {}
	}
}
