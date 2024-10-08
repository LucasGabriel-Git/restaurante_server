import type { FastifyPluginAsync } from 'fastify'
import { ClienteController } from 'src/controller/ClientController'

export const clientRoutes: FastifyPluginAsync = async (app) => {
	const clientController = new ClienteController()
	app.post('/client', clientController.save)
	app.get('/clients', clientController.list)
	app.delete('/client/:id_cliente', clientController.delete)
	app.put('/client/:id_cliente', clientController.update)
}
