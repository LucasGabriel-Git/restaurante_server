import '@fastify/jwt'

declare module 'fastify-jwt' {
	interface FastifyInstance {
		user?: {
			id: string
		}
	}
}
