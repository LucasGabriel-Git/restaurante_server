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
import {
	createClientRoute,
	deleteClientRoute,
	listClientRoute,
	updateClientRoute,
} from './routes/clients/client-routes'
import {
	createEmployeeRoute,
	deleteEmployeeRoute,
	listEmployeeRoute,
	updateEmployeeRoute,
} from './routes/employers/employeers-routes'
import {
	createUserRoute,
	deleteUserRoute,
	getUserLoggedRoute,
	listUserRoute,
	loginRoute,
	updateUserRoute,
} from './routes/users/user-routes'
import {
	createCategoryRoute,
	listCategoryRoute,
} from './routes/categories/category-routes'
import {
	createProductRoute,
	getProductsList,
} from './routes/product/product-routes'

const app = fastify().withTypeProvider<ZodTypeProvider>()
app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.register(fastifyCors, {
	origin: '*',
})

app
	.register(createUserRoute)
	.register(listUserRoute)
	.register(updateUserRoute)
	.register(deleteUserRoute)
	.register(getUserLoggedRoute)
	.register(loginRoute)
	.register(createEmployeeRoute)
	.register(listEmployeeRoute)
	.register(updateEmployeeRoute)
	.register(deleteEmployeeRoute)
	.register(createClientRoute)
	.register(listClientRoute)
	.register(deleteClientRoute)
	.register(createCategoryRoute)
	.register(listCategoryRoute)
	.register(createProductRoute)
	.register(getProductsList)
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
