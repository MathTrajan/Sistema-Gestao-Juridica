# CHANGELOG — Sistema Norma Jurídico

Registro de todas as versões, mudanças e evoluções do sistema.  
Formato: **[versão] — Data — Descrição resumida**

---

## [v1.3.1] — 2026-06-30 — Fix Crítico: CRON bloqueado pelo middleware

### Bug Crítico Corrigido
- **[CRÍTICO]** Fix middleware: `/api/cron/*` estava sendo bloqueado pelo middleware de autenticação antes de chegar ao handler — o CRON_SECRET nunca era verificado e o Vercel Cron nunca conseguia chamar o endpoint. Adicionado `/api/cron` às rotas públicas do middleware (o handler já valida o Bearer token internamente).

---

## [v1.3.0] — 2026-06-30 — Correções de Segurança, RBAC e Qualidade

### Segurança
- **[CRÍTICO]** Fix login multi-tenant: substituído `findFirst` por `findMany` + loop bcrypt no `authorize()` — impede autenticação incorreta quando o mesmo e-mail existe em dois escritórios
- **[ALTO]** Endpoint `/api/cron/datajud` agora sempre exige `CRON_SECRET` — anteriormente era público se a variável não estivesse definida
- **[ALTO]** `GET /api/usuarios` agora exige perfil `GERENTE` ou `GESTOR_GERAL` — COLABORADORs não podem mais enumerar usuários do tenant

### RBAC e Permissões
- **[ALTO]** Middleware alinhado com a Sidebar: quando `permissoes[]` está vazio, COLABORADORs agora usam `AREA_ROUTES[area]` como fallback — elimina a inconsistência onde a sidebar mostrava links que o middleware bloqueava
- **[ALTO]** `/api/leads` (GET, POST, PUT, DELETE) protegido com `guardArea('COMERCIAL')` — COLABORADORs de outras áreas não acessam mais o CRM via chamada direta à API

### Bugs Críticos de Integridade de Dados
- **[CRÍTICO]** Fix `DELETE /api/clientes`: bloqueia exclusão se houver lançamentos financeiros vinculados; cascadeia atendimentos e documentos em transação antes de excluir
- **[CRÍTICO]** Fix `DELETE /api/processos`: deleta em ordem correta dentro de `$transaction` — comentários → tarefas → prazos → documentos → andamentos → movimentações → processo; elimina erro FK constraint
- Fix `DELETE /api/leads`: cascadeia atendimentos antes de excluir o lead
- Fix `DELETE /api/tarefas/[id]`: cascadeia comentários antes de excluir a tarefa

### Novas Funcionalidades
- **DELETE de Andamentos**: novo endpoint `DELETE /api/processos/[id]/andamentos/[andamentoId]` com botão de confirmação no frontend (`AndamentosClient.tsx`)
- **DELETE de Comentários**: novo endpoint `DELETE /api/tarefas/[id]/comentarios/[comentarioId]` com botão de confirmação no frontend (`ComentariosSection.tsx`)
- **`criadorId` em Tarefas**: POST de tarefas agora registra `criadorId = session.user.id` — rastreabilidade de criação
- **`dataConclusao` automática**: ao mover tarefa para `CONCLUIDO`, o campo é preenchido automaticamente se não informado
- **Versão do sistema no frontend**: label `v1.3.0` exibido no rodapé da sidebar (arquivo centralizado em `src/lib/version.ts`)

### Validações de Negócio
- Prazos: adicionada validação `dataFinal >= dataInicio` no POST e PUT — retorna 400 se inválido

### Qualidade e Padronização
- Migração de `NextResponse.json()` para `apiJsonResponse/apiErrorResponse` nos endpoints: `/api/clientes`, `/api/processos` (POST), `/api/tarefas`, `/api/prazos`, `/api/financeiro`, `/api/leads`, `/api/usuarios` — garante sanitização UTF-8 uniforme em toda a API
- `lib/env.ts`: validação de `CRON_SECRET` em produção reforçada

### Organização do Projeto
- Arquivos HTML de protótipo movidos para `Prototipos/`
- `ENCODING_MODAL_FIX.md` movido para `Docs/`
- Pasta `norma/graphify-out/` (cache de análise) removida
- Worktrees de agentes antigos removidas

---

## [v1.2.0] — 2026-06-26 — Atendimentos, Documentos, Andamentos e Comentários

### Novas Funcionalidades
- **Módulo Atendimentos**: API `GET/POST /api/atendimentos` + `DELETE /api/atendimentos/[id]`; componente compartilhado `AtendimentosSection.tsx` (usado em clientes e leads)
- **Módulo Documentos**: API `GET/POST /api/documentos` + `DELETE /api/documentos/[id]`; componente compartilhado `DocumentosSection.tsx` (links externos, suporte a Google Drive etc.)
- **Andamentos de Processo**: componente `AndamentosClient.tsx` na página de detalhe do processo; API `POST /api/processos/[id]/andamentos`
- **Comentários em Tarefas**: componente `ComentariosSection.tsx` no modal de edição do KanbanBoard; API `GET/POST /api/tarefas/[id]/comentarios`

### Integrações
- `AtendimentosSection` integrada na página de detalhe de Cliente (`/clientes/[id]`)
- `AtendimentosSection` integrada na tela Comercial/CRM para Leads
- `DocumentosSection` integrada na página de detalhe de Cliente e Processo

---

## [v1.1.0] — 2026-05-12 — DataJud, Performance e Monitoramento

### DataJud (CNJ)
- Integração com a API pública DataJud via ElasticSearch
- Sincronização manual de movimentações por processo (botão na página de detalhe)
- Cron automático diário (`/api/cron/datajud`, 06:00 UTC) sincronizando todos os processos ativos
- Página `/datajud` para busca de processos por advogado (OAB + tribunal)
- Modelo `Movimentacao` para armazenar movimentações DataJud com deduplicação por `codigoExterno`
- Modelo `AdvogadoMonitorado` para monitoramento por OAB
- Notificações persistidas (`DATAJUD_MOVIMENTACAO`) criadas automaticamente nas sincronizações

### Performance
- Índices de performance adicionados no banco: campos de busca frequente (`email`, `cpf`, `numero`, `status`, etc.)

### Permissões
- Campo `permissoes: String[]` adicionado ao modelo `Usuario` — permite configurar rotas específicas por colaborador além do sistema de área

---

## [v1.0.1] — 2026-04-26 — Prazos em Tarefas e Financeiro Recorrente

### Mudanças
- Tarefas podem agora ser vinculadas a um prazo (`prazoId`) — dropdown de prazos do processo no formulário de tarefa
- Campo `recorrente: Boolean` adicionado em `Lancamento` (financeiro) — estrutura para futura automação de cobranças recorrentes

---

## [v1.0.0] — 2026-04-05 — Lançamento Inicial

### Sistema Base
**Autenticação e Multi-tenancy**
- Login com e-mail + senha (bcrypt), sessão JWT sem tabela de sessões
- Multi-tenancy completo: cada `Escritorio` é um tenant isolado; todas as queries filtradas por `escritorioId`
- RBAC com 3 perfis: `GESTOR_GERAL`, `GERENTE`, `COLABORADOR`
- Middleware de guarda de rotas + rate limiting por IP

**Módulos Implementados**
- **Clientes**: CRUD completo com paginação, busca, suporte PF/PJ, endereço, status, observações
- **Processos**: CRUD com status, fases, área jurídica, tribunal, vara, comarca, valor da causa
- **Tarefas**: Kanban com drag-and-drop (5 colunas), prioridade, responsável, data de vencimento
- **Prazos**: CRUD vinculado a processos, tipos, datas início/fim, dias úteis, status
- **Financeiro**: Lançamentos de entrada/saída, status de pagamento, datas, categoria (acesso por área)
- **Comercial/CRM**: Leads com funil de 6 etapas, temperatura, origem, conversão para cliente
- **Usuários**: CRUD de usuários do escritório (GERENTE+)
- **Configurações**: Dados do escritório editáveis pelo GESTOR_GERAL
- **Dashboard**: KPIs, clientes recentes, tarefas pendentes
- **Notificações**: Prazos próximos (≤7 dias), tarefas vencidas, notificações DataJud

**Design System**
- Dark glassmorphism com acento gold (`#B8962A`)
- Sidebar recolhível com hover-expand, pin e mobile overlay
- Framer Motion em listas, cards e modais

---

*Documento mantido em `Docs/CHANGELOG.md`. Atualizar a cada versão junto com `src/lib/version.ts`.*
