import type { FastifyPluginAsync } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { CategoriaController } from 'src/controller/CategoriaController'

export const createCategoryRoute: FastifyPluginAsync = async (app) => {
	app.post('/category', new CategoriaController().save)
}

export const listCategoryRoute: FastifyPluginAsync = async (app) => {
	app.get('/categories', new CategoriaController().list)
}
