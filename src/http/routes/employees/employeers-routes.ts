import type { FastifyPluginAsync } from 'fastify'
import { FuncionarioController } from 'src/controller/EmployeeController'

export const employeesRoutes: FastifyPluginAsync = async (app) => {
	const employeeController = new FuncionarioController()
	app.post('/employee', employeeController.save)
	app.get('/employees', employeeController.list)
	app.put('/employee/:id', employeeController.update)
	app.delete('/employee/:id', employeeController.delete)
}
