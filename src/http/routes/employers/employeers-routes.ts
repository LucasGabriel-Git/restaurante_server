import type { FastifyPluginAsync } from 'fastify'
import { FuncionarioController } from 'src/controller/FuncionarioController'

export const createEmployeeRoute: FastifyPluginAsync = async (app) => {
	app.post('/employee', new FuncionarioController().save)
}

export const listEmployeeRoute: FastifyPluginAsync = async (app) => {
	app.get('/employees', new FuncionarioController().list)
}

export const updateEmployeeRoute: FastifyPluginAsync = async (app) => {
	app.put('/employee/:id', new FuncionarioController().update)
}

export const deleteEmployeeRoute: FastifyPluginAsync = async (app) => {
	app.delete('/employee/:id', new FuncionarioController().delete)
}
