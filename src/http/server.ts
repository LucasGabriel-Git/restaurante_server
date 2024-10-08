import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import 'dotenv/config'
import fastify from 'fastify'
import {
	type ZodTypeProvider,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from '../env'
import { categoryRoutes } from './routes/categories/category-routes'
import { clientRoutes } from './routes/clients/client-routes'
import { employeesRoutes } from './routes/employees/employeers-routes'
import { orderRoutes } from './routes/orders/order-routes'
import { productRoutes } from './routes/product/product-routes'
import { userRoutes } from './routes/users/user-routes'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
	origin: '*',
})

app
	.register(userRoutes)
	.register(employeesRoutes)
	.register(clientRoutes)
	.register(categoryRoutes)
	.register(productRoutes)
	.register(orderRoutes)
	.register(fastifyJwt, { secret: env.JWT_SECRET })

app.setErrorHandler((error, _, reply) => {
	if (error instanceof Error) {
		return reply.status(500).send({ error: error.message })
	}
})

app.listen({ port: env.PORTA, host: '0.0.0.0' }, (err, address) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}

	console.log(`Server listening on ${env.PORTA}`)
})
