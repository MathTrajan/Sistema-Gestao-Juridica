<div align="center">

# ⚖️ Norma — Sistema de Gestão Jurídica

Sistema de gestão jurídica multi-tenant para escritórios de advocacia, com foco em operação diária, controle interno e visão gerencial. Integração com a API do **DataJud (CNJ)** para dados oficiais de processos.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth_v5-000000?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white)

</div>

> O app principal deste repositório está em [`norma/`](./norma).

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
├─ Prototipos/   # referências visuais e protótipos
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

---

<div align="center">

Desenvolvido por **Matheus Trajano** · [LinkedIn](https://www.linkedin.com/in/matheus-trajano-5179a7378/)

</div>

