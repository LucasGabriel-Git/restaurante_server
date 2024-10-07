import type { FastifyPluginAsync } from 'fastify'
import { ProdutosController } from 'src/controller/ProductController'

export const createProductRoute: FastifyPluginAsync = async (app) => {
	app.post('/product', new ProdutosController().create)
}

export const getProductsList: FastifyPluginAsync = async (app) => {
	app.get('/products', new ProdutosController().list)
}

export const updateProductRoute: FastifyPluginAsync = async (app) => {
	app.put('/product/:productId', new ProdutosController().update)
}
