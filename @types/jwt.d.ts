import 'fastify-jwt'

declare module 'fastify-jwt' {
	interface VerifyPayloadType {
		id: string
	}
}
