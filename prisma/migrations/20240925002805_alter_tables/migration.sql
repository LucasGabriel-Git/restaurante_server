/*
  Warnings:

  - The `tipo` column on the `usuario` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "tipo" AS ENUM ('CLIENTE', 'FUNCIONARIO', 'ADMIN');

-- AlterTable
ALTER TABLE "usuario" ALTER COLUMN "senha" DROP NOT NULL,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "tipo" NOT NULL DEFAULT 'CLIENTE';
