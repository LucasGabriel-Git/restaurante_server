import type { FastifyPluginAsync } from 'fastify'
import { OrderController } from 'src/controller/OrderController'

export const orderRoutes: FastifyPluginAsync = async (app) => {
	const orderController = new OrderController()
	app.post('/order', orderController.save)
	app.get('/orders', orderController.list)
	app.put('/order/update-status', orderController.updateStatus)
	app.put('/order/cancel', orderController.cancelOrder)
	app.get('/orders/by-client', orderController.getByCliente)
	app.get('/orders/month', orderController.getTotalOrdersinMonth)
	app.get('/order/:id', orderController.findById)
}
