import type { FastifyPluginAsync } from 'fastify'
import { ProdutosController } from 'src/controller/ProductController'

export const productRoutes: FastifyPluginAsync = async (app) => {
	const productController = new ProdutosController()
	app.post('/product', productController.create)
	app.get('/products', productController.list)
	app.put('/product/:productId', productController.update)
}
