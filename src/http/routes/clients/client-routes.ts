import type { FastifyPluginAsync } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { ClienteController } from 'src/controller/ClientController'

export const createClientRoute: FastifyPluginAsync = async (app) => {
	app.post('/client', new ClienteController().save)
}

export const listClientRoute: FastifyPluginAsyncZod = async (app) => {
	app.get('/clients', new ClienteController().list)
}

export const deleteClientRoute: FastifyPluginAsync = async (app) => {
	app.delete('/client/:id_cliente', new ClienteController().delete)
}

export const updateClientRoute: FastifyPluginAsync = async (app) => {
	app.put('/client/:id_cliente', new ClienteController().update)
}
