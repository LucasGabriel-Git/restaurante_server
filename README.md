# Sistema de Gerenciamento de Pedidos
Este projeto é uma API para um sistema de gerenciamento de pedidos de um restaurante. O sistema permite o cadastro de usuários, gerenciamento de clientes, funcionários, produtos, e a criação de pedidos. A estrutura é composta por diversos relacionamentos entre as entidades, como clientes e pedidos, funcionários e pedidos, produtos e categorias, além do controle de estoque. O projeto foi desenvolvido utilizando Node.js, Typescript, Fastify, Prisma como ORM, e PostgreSQL como banco de dados.

## Tecnologias Utilizadas
[![My Skills](https://skillicons.dev/icons?i=nodejs,typescript,prisma,postgres)](https://skillicons.dev)

## O sistema oferece as seguintes funcionalidades:

1. **Gerenciamento de Categorias**: Cadastro e listagem de categorias de produtos.
2. **Gerenciamento de Produtos**: Cadastro de produtos, vinculação a categorias, e controle de estoque.
3. **Cadastro de Usuários**: Criação de usuários com diferentes tipos (cliente, funcionário e admin).
4. **Gerenciamento de Pedidos**: Criação e gerenciamento de pedidos, com status e histórico.
5. **Controle de Estoque**: Acompanhar o estoque de produtos e sua utilização nos pedidos.
6. **Autenticação**: Proteção das rotas através de autenticação JWT.

## Requisitos

- **Node.js** (v16.x ou superior)
- **PostgreSQL**
- **Prisma CLI** para gerenciamento do ORM

## Instalação e Configuração

1. Clone o repositório:

   ```bash
   git clone https://github.com/usuario/restaurante_server.git
   ```
1. Acesse o diretório do projeto:

   ```bash
   cd restaurante_server
   ```
3. Instale as dependências
   ### NPM
   ```bash
   npm install
   ```
   ### Yarn
   ```bash
   yarn add
   ```
   ### PNPM
   ```bash
   pnpm install
   ```
4. Crie um arquivo .env na raiz do projeto com as seguintes variáveis de ambiente:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/nome_do_banco"
   JWT_SECRET="sua_chave_secreta"
   ```
5. Execute as migrações do banco de dados para criar as tabelas:
   ```bash
   npx risma migrate dev
   ```
6. Inicie a aplicação:
   ```bash
   npm run dev
   ```

# Estrutura do projeto
  - **/src/controllers:** Contém os controladores responsáveis pelas operações de cada entidade (cliente, produto, pedido, etc).
  - **/src/routes:** Definição das rotas da API, utilizando Fastify.
  - **/src/schemas:** Definições dos tipos e validações de dados usando TypeScript.
  - **/prisma:** Configurações do Prisma e migrações do banco de dados.

# Autenticação
  O sistema utiliza JWT (JSON Web Token) para proteger as rotas. Após o login, o usuário recebe um token que deve ser enviado no cabeçalho de cada requisição para acessar as rotas protegidas.

### Exemplo de cabeçalho:
  ```json
  {
  "Authorization": "Bearer <seu_token>"
  }
  ```

# Como Contribuir
1. Faça um fork deste repositório.
2. Crie uma branch com a sua feature: ```git checkout -b minha-feature```
3. Commit suas alterações: ```git commit -m 'Adiciona nova funcionalidade'```
4. Faça um push para a branch: ```git push origin minha-feature```
5. Abra um Pull Request.

# Licença
Este projeto está sob a licença MIT.
