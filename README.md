# Norma

Sistema de gestão jurídica para escritórios de advocacia, com foco em operação diária, controle interno e visão gerencial.

O app principal deste repositório está em [`norma/`](./norma).

## Visão Geral

O projeto reúne os módulos centrais de um escritório:

- Dashboard com indicadores operacionais
- Clientes
- Processos
- Tarefas em Kanban
- Prazos processuais
- Financeiro
- Comercial / CRM
- Controladoria
- Relatórios
- Usuários e permissões
- Configurações do escritório

## Stack

- Next.js 16 + App Router
- React 19
- TypeScript 5
- Prisma ORM
- PostgreSQL
- NextAuth v5
- Tailwind CSS 4
- Framer Motion
- Recharts
- React Hook Form + Zod

## Estrutura Do Repositório

```text
Sistema-Gestao-Jurídico/
├─ norma/        # aplicação principal
├─ ModeloV2/     # referências visuais e protótipos
├─ Docs/         # arquivos de apoio e documentação
└─ LogoMarca/    # materiais de marca
```

## Como Rodar

```bash
cd norma
npm install
```

Crie um arquivo `.env` em `norma/` com base no `.env.example`.

Variáveis esperadas:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/norma"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/norma"
NEXTAUTH_SECRET="gere-um-secret-com-pelo-menos-32-caracteres"
NEXTAUTH_URL="http://localhost:3001"
NEXT_PUBLIC_SENTRY_DSN=""
```

Depois:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Aplicação local:

- `http://localhost:3001`

Login inicial do seed:

- E-mail: `admin@escritorio.com`
- Senha: `123456`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Arquitetura

Dentro de [`norma/src`](./norma/src):

- `app/`: rotas, layouts e APIs
- `components/`: componentes por domínio
- `lib/`: autenticação, utilitários e integrações
- `types/`: extensões de tipos

Dentro de [`norma/prisma`](./norma/prisma):

- `schema.prisma`: modelo de dados
- `migrations/`: histórico de banco
- `seed.ts`: dados iniciais de desenvolvimento

## Segurança E Acesso

O sistema já possui:

- autenticação com credenciais
- proteção de rotas via middleware
- níveis de acesso por perfil
- restrição por área para colaboradores
- rate limit básico para rotas de API

Perfis disponíveis:

- `GESTOR_GERAL`
- `GERENTE`
- `COLABORADOR`

Áreas disponíveis:

- `JURIDICO`
- `COMERCIAL`
- `FINANCEIRO`
- `CONTROLADORIA`
- `MARKETING`

## Observações Para Publicação No GitHub

- O diretório principal para desenvolvimento e deploy é `norma/`
- Não suba `.env`, logs locais ou artefatos de build
- O seed é voltado para desenvolvimento e não deve ser usado em produção
- Em produção, troque `NEXTAUTH_SECRET` e as credenciais padrão

## Status Atual

O projeto está funcional e organizado para continuidade de desenvolvimento. Há melhorias técnicas ainda possíveis em lint e tipagem em alguns arquivos legados, mas isso não impede a publicação do repositório.

