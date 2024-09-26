import type { FastifyPluginAsync } from 'fastify'
import { UsuarioController } from '../../../controller/UsuarioController'

export const createUserRoute: FastifyPluginAsync = async (app) => {
	app.post('/user', new UsuarioController().save)
}

export const listUserRoute: FastifyPluginAsync = async (app) => {
	app.get('/users', new UsuarioController().list)
}

export const updateUserRoute: FastifyPluginAsync = async (app) => {
	app.put('/user/:id', new UsuarioController().update)
}

export const deleteUserRoute: FastifyPluginAsync = async (app) => {
	app.delete('/user/:id', new UsuarioController().delete)
}

export const loginRoute: FastifyPluginAsync = async (app) => {
	app.post('/login', new UsuarioController().login)
}

export const getUserLoggedRoute: FastifyPluginAsync = async (app) => {
	app.get('/user/logged', new UsuarioController().getUserLogged)
}
