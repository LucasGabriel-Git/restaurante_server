import { z } from 'zod'
import 'dotenv/config'
const envSchema = z.object({
	DATABASE_URL: z.string().url(),
	PORTA: z.coerce.number().default(3000),
	JWT_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)
