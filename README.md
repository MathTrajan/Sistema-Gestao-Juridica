# JurisFlow

Sistema de gestão jurídica integrado para escritórios de advocacia. Desenvolvido como protótipo pessoal com estrutura pensada para evolução a produto comercial (SaaS).

**Demo:** https://projetosasjuridico.vercel.app

## Objetivo

Centralizar o gerenciamento de clientes, processos, prazos, tarefas, financeiro e pipeline comercial em uma única plataforma, eliminando planilhas e sistemas dispersos nos escritórios.

## Funcionalidades

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs em tempo real: clientes ativos, processos em andamento, prazos críticos |
| **Clientes** | Cadastro de PF/PJ com busca de CEP automática (ViaCEP) |
| **Processos** | Gestão de processos judiciais e administrativos com fases e status |
| **Tarefas** | Kanban board com arrastar e soltar, prioridades e responsáveis |
| **Prazos** | Controle de prazos processuais com alertas de vencimento |
| **Financeiro** | Controle de receitas e despesas com marcação de pagamentos |
| **Comercial** | Funil de vendas com 6 etapas e lead scoring |
| **Controladoria** | Visão operacional de processos sem responsável e clientes pendentes |
| **Relatórios** | Consolidado de métricas por módulo |
| **Usuários** | Gestão de equipe com perfis: Gestor Geral, Gerente e Colaborador |
| **Configurações** | Dados do escritório e plano contratado |

## Tecnologias

- **Framework:** Next.js 16 (App Router) + React 19
- **Linguagem:** TypeScript 5
- **Banco de dados:** PostgreSQL 18 via Prisma ORM 5
- **Autenticação:** NextAuth v5 (JWT + bcrypt)
- **UI:** Tailwind CSS 4 + Radix UI + Lucide React
- **Validação:** Zod + React Hook Form
- **Cache de estado:** TanStack React Query

## Pré-requisitos

- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

## Instalação e execução

```bash
# 1. Acesse a pasta do projeto
cd jurisflow

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL e um NEXTAUTH_SECRET forte
# Gere o secret com: openssl rand -base64 32

# 4. Execute as migrations do banco de dados
npx prisma migrate deploy

# 5. Popule o banco com o usuário administrador padrão
npx prisma db seed

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse em: **http://localhost:3000**

**Login padrão após o seed:**
- E-mail: `admin@escritorio.com`
- Senha: `123456`
- **Troque a senha no primeiro acesso!**

## Estrutura do projeto

```
jurisflow/
├── prisma/
│   ├── migrations/        # Histórico de migrations do banco
│   └── seed.ts            # Script de dados iniciais
├── src/
│   ├── app/
│   │   ├── (auth)/        # Páginas públicas (login)
│   │   ├── (dashboard)/   # Páginas protegidas
│   │   └── api/           # Endpoints REST
│   ├── components/        # Componentes React por módulo
│   ├── lib/
│   │   ├── auth.ts        # Configuração NextAuth
│   │   ├── constants.ts   # Valores dos enums (fonte única de verdade)
│   │   ├── prisma.ts      # Singleton do Prisma
│   │   └── utils.ts       # Formatadores (CPF, CNPJ, telefone)
│   ├── middleware.ts       # Proteção de rotas por autenticação
│   └── types/
│       └── next-auth.d.ts # Tipagem da sessão estendida
└── Docs/                  # Documentação de requisitos
```

## Variáveis de ambiente

Crie o arquivo `jurisflow/.env` baseado no `.env.example`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/jurisflow"
NEXTAUTH_SECRET="string-aleatoria-de-32-chars-minimo"
NEXTAUTH_URL="http://localhost:3000"
```

## Possíveis melhorias futuras

- [ ] Upload e visualização de documentos (S3 / Cloudflare R2)
- [ ] Integração com DataJud para captura automática de andamentos
- [ ] Cálculo automático de prazos em dias úteis
- [ ] Notificações por e-mail e WhatsApp para prazos críticos
- [ ] 2FA (autenticação em dois fatores)
- [ ] Log de auditoria de todas as alterações
- [ ] Busca global com filtros avançados
- [ ] Exportação de relatórios em PDF / Excel
- [ ] App mobile (React Native)
- [ ] Arquitetura multi-tenant para SaaS

## Licença

Projeto pessoal — todos os direitos reservados.
