import type { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from 'src/client/prisma'
import { z } from 'zod'

const DataSchema = z.object({
	nome: z.string(),
	descricao: z.string(),
	preco: z.coerce.number(),
	id_categoria: z.string(),
	quantidade: z.number(),
	tempo_preparo: z.coerce.number(),
	imagem: z.string(),
})

type IProduto = z.infer<typeof DataSchema>

export class ProdutosController {
	async create(req: FastifyRequest, res: FastifyReply) {
		try {
			if (!req.headers.authorization)
				return res.status(400).send({ error: 'Unauthorized' })
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
							tempo_preparo: data.tempo_preparo,
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

	async update(req: FastifyRequest, res: FastifyReply) {
		try {
			if (!req.headers.authorization)
				return res.status(400).send({ error: 'Unauthorized' })
			const data = req.body as IProduto
			const { productId } = req.params as { productId: string }
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
				if (hasProduct) {
					await prisma.produto
						.update({
							where: {
								id_produto: productId,
							},
							data: {
								nome: data.nome,
								preco: data.preco,
								descricao: data.descricao,
								id_categoria: data.id_categoria,
								estoque: {
									update: {
										quantidade: data.quantidade,
									},
								},
							},
						})
						.then((_) => {
							return res
								.status(200)
								.send({ message: 'Product updated successfully' })
						})
						.catch((err) => {
							return res.status(500).send({ message: err.message })
						})
				}
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

			if (token === undefined || token === null)
				return res.status(401).send({ error: 'Unauthorized' })

			const payload = (await req.jwtDecode()) as { id: string }

			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: payload.id,
					OR: [{ tipo: 'ADMIN' }, { tipo: 'FUNCIONARIO' }],
				},
			})

			if (!userHasPermission) {
				return res.status(401).send({
					error: 'Only admins can access this page.',
				})
			}
			return res.status(200).send(
				await prisma.produto.findMany({
					select: {
						id_produto: true,
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
						tempo_preparo: true,
					},
				}),
			)
		} catch (err) {
			if (err instanceof Error) {
				console.log(err.message)
				return res.status(400).send({ error: err.message })
			}
		}
	}
}
