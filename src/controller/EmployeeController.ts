import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../client/prisma'
import { hash } from 'bcrypt'

const EmployeerSchema = z.object({
	nome: z.string(),
	email: z.string().email(),
	senha: z.string(),
	cargo: z.string(),
	tipo: z.literal('FUNCIONARIO').default('FUNCIONARIO'),
	comissao: z.string().optional(),
})

type BodySchema = z.infer<typeof EmployeerSchema>

export class FuncionarioController {
	async save(req: FastifyRequest, res: FastifyReply) {
		try {
			const data = req.body as BodySchema
			const decodedUser = (await req.jwtVerify()) as { id: string }
			const userHasExists = await prisma.usuario.findFirst({
				where: {
					email: data.email,
				},
			})

			if (data.tipo === 'FUNCIONARIO' && !userHasExists) {
				const currentUser = decodedUser.id
				const isAdmin = await prisma.usuario.findFirst({
					where: {
						id_usuario: currentUser,
						tipo: 'ADMIN',
					},
				})

				if (!isAdmin) {
					return res.status(400).send({
						error: 'Only restaurant owner(Admin) can create employees',
					})
				}

				const hashedPassword = await hash(data.senha, 6)

				const user = await prisma.usuario.create({
					data: {
						nome: data.nome,
						email: String(data.email),
						senha: hashedPassword,
						tipo: 'FUNCIONARIO',
						funcionario: {
							create: {
								cargo: data.cargo,
								comissao: data.comissao,
							},
						},
					},
				})
				return res.send(user)
			}

			if (userHasExists)
				return res.status(400).send({ error: 'User/Employee already exists' })
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

			const decodedUser = (await req.jwtVerify()) as { id: string }

			const userHasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: decodedUser.id,
					AND: [{ OR: [{ tipo: 'ADMIN' }, { tipo: 'FUNCIONARIO' }] }],
				},
			})

			if (!userHasPermission)
				return res.status(404).send({ error: 'Unauthorized' })

			const users = await prisma.funcionario.findMany({
				select: {
					id_funcionario: true,
					cargo: true,
					comissao: true,
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

			if (users.length === 0) return res.send({ message: 'No employees found' })

			return res.send(users)
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
			const decodedUser = (await req.jwtVerify()) as { id: string }

			const userHasExists = await prisma.funcionario.findFirst({
				where: {
					id_funcionario: id,
				},
				select: {
					usuario: {
						select: {
							email: true,
							tipo: true,
							nome: true,
						},
					},
				},
			})

			if (!userHasExists)
				return res.status(400).send({
					error: 'User not found.',
				})

			if (data.tipo === 'FUNCIONARIO' && userHasExists) {
				const currentUser = decodedUser.id
				const isAdmin = await prisma.usuario.findFirst({
					where: {
						id_usuario: currentUser,
						AND: [
							{
								tipo: 'ADMIN',
							},
						],
					},
				})

				if (!userHasExists)
					return res.status(400).send({ error: 'User not found.' })

				if (!isAdmin) {
					return res.status(400).send({
						error: 'Only restaurant owner(Admin) can create/update employees',
					})
				}

				const updatedUser = await prisma.funcionario.update({
					where: {
						id_funcionario: id,
					},
					data: {
						cargo: data.cargo,
						comissao: data.comissao,
						usuario: {
							update: {
								nome: data.nome,
								email: data.email,
								senha: data.senha ? await hash(data.senha, 6) : undefined,
							},
						},
					},
					select: {
						id_funcionario: true,
						cargo: true,
						comissao: true,
						usuario: {
							select: {
								id_usuario: true,
								nome: true,
								email: true,
								tipo: true,
								created_at: true,
								updated_at: true,
							},
						},
					},
				})

				return res.send(updatedUser)
			}
		} catch (error) {
			if (error instanceof Error) {
				console.log(error.message)
				return res.status(400).send({ error: error.message })
			}
		}
	}

	async delete(req: FastifyRequest, res: FastifyReply) {
		try {
			const { id } = req.params as { id: string }
			const decodedUser = (await req.jwtVerify()) as { id: string }

			const hasPermission = await prisma.usuario.findFirst({
				where: {
					id_usuario: decodedUser.id,
					AND: [
						{
							tipo: 'ADMIN',
						},
					],
				},
			})
			const employee = await prisma.funcionario.findFirst({
				where: {
					id_funcionario: id,
				},
				select: {
					usuario: {
						select: {
							tipo: true,
						},
					},
				},
			})

			if (employee?.usuario?.tipo === 'FUNCIONARIO' && hasPermission) {
				await prisma.funcionario.delete({
					where: {
						id_funcionario: id,
					},
				})
				return res.send({
					message: 'Employee deleted',
				})
			}

			return res.status(400).send({
				error: 'Not employee found',
			})
		} catch (error) {
			if (error instanceof Error) {
				return res.status(400).send({ error: error.message })
			}
		}
	}
}
