import type { FastifyPluginAsync } from 'fastify'
import { ClienteController } from 'src/controller/ClienteController'

export const createClientRoute: FastifyPluginAsync = async (app) => {
	app.post('/client', new ClienteController().save)
}

export const listClientRoute: FastifyPluginAsync = async (app) => {
	app.get('/clients', new ClienteController().list)
}

export const deleteClientRoute: FastifyPluginAsync = async (app) => {
	app.delete('/client/:id_cliente', new ClienteController().delete)
}
