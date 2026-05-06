# Norma

Sistema de gestão jurídica construído com Next.js, Prisma e PostgreSQL.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL
- NextAuth v5
- Tailwind CSS 4
- Framer Motion
- Recharts
- Zod + React Hook Form

## Funcionalidades

- Dashboard com indicadores
- Gestão de clientes
- Gestão de processos
- Tarefas em Kanban
- Controle de prazos
- Financeiro
- Comercial / CRM
- Controladoria
- Relatórios
- Usuários e permissões
- Configurações

## Instalação

```bash
npm install
```

## Variáveis De Ambiente

Crie `.env` com:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/norma"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/norma"
NEXTAUTH_SECRET="gere-um-secret-com-pelo-menos-32-caracteres"
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_SENTRY_DSN=""
```

## Banco De Dados

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

## Desenvolvimento

```bash
npm run dev
```

Aplicação local:

- `http://localhost:3001`

## Build

```bash
npm run build
npm run start
```

## Login Inicial Do Seed

- E-mail: `admin@escritorio.com`
- Senha: `123456`

Troque essas credenciais ao usar o sistema fora de ambiente local.

## Estrutura

```text
norma/
├─ prisma/
├─ public/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  └─ types/
├─ package.json
└─ next.config.ts
```

## Observações

- O projeto usa autenticação com credenciais e sessão JWT
- O middleware aplica proteção de rotas e controle básico de rate limit
- `DIRECT_URL` também é esperada pelo Prisma no schema atual
- O seed é somente para desenvolvimento

