import type { FastifyPluginAsync } from 'fastify'
import { CategoriaController } from 'src/controller/CategoryController'

export const categoryRoutes: FastifyPluginAsync = async (app) => {
	const categoryController = new CategoriaController()
	app.post('/category', categoryController.save)
	app.get('/categories', categoryController.list)
	app.put('/category/update/:id', categoryController.update)
}
