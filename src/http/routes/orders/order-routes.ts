import type { FastifyPluginAsync } from 'fastify'
import { OrderController } from 'src/controller/OrderController'

export const createOrderRoute: FastifyPluginAsync = async (app) => {
	app.post('/order', new OrderController().save)
}

export const listOrderRoute: FastifyPluginAsync = async (app) => {
	app.get('/orders', new OrderController().list)
}

export const updateOrderStatusRoute: FastifyPluginAsync = async (app) => {
	app.put('/order/update-status', new OrderController().updateStatus)
}

export const cancelOrderRoute: FastifyPluginAsync = async (app) => {
	app.put('/order/cancel', new OrderController().cancelOrder)
}
