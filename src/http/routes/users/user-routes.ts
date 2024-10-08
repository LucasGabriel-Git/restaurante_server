import type { FastifyPluginAsync } from 'fastify'
import { UsuarioController } from '../../../controller/UserController'

export const userRoutes: FastifyPluginAsync = async (app) => {
	const userController = new UsuarioController()
	app.post('/user', userController.save)
	app.get('/users', userController.list)
	app.put('/user/:id', userController.update)
	app.delete('/user/:id', userController.delete)
	app.post('/login', userController.login)
	app.get('/user/logged', userController.getUserLogged)
}
