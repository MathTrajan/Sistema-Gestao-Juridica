# Guia de Correção: Encoding UTF-8 e Estrutura de Modais

## 1. CORREÇÕES APLICADAS

### ✅ Encoding UTF-8

- **Adicionado**: `<meta charSet="UTF-8" />` no `layout.tsx`
- **Criado**: Utilitário `sanitizeUTF8()` em `src/lib/utils.ts` para corrigir texto corrompido
- **Criado**: Helper `apiJsonResponse()` em `src/lib/api-helpers.ts` com charset UTF-8 automático
- **Atualizado**: Rota de API `/api/processos` como exemplo

### ✅ Estrutura de Modais

Todos os modais foram refatorados de:
```tsx
// ❌ ANTES: estrutura quebrada
<div className="fixed inset-0 z-50 overflow-y-auto p-4">
  <div className="absolute inset-0" /> {/* overlay */}
  <div className="relative max-h-[calc(100vh-2rem)] overflow-y-auto">
    {/* conteúdo */}
  </div>
</div>
```

Para:
```tsx
// ✅ DEPOIS: estrutura corrigida
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">{/* sticky header */}</div>
    <div className="modal-body">{/* conteúdo scrollável */}</div>
    <div className="modal-footer">{/* botões */}</div>
  </div>
</div>
```

**Componentes corrigidos:**
- ProcessoEditModal.tsx
- ComercialClient.tsx
- UsuariosClient.tsx
- FinanceiroClient.tsx
- KanbanBoard.tsx (tarefas)
- PrazosClient.tsx

---

## 2. COMO USAR OS NOVOS UTILITÁRIOS

### Corrigir texto com encoding problemático:

```typescript
import { sanitizeUTF8 } from '@/lib/utils'

// Exemplo: "mÃªs" → "mês"
const texto = sanitizeUTF8("mÃªs")
console.log(texto) // "mês"

// Corrigir objetos inteiros:
import { sanitizeUTF8Deep } from '@/lib/utils'

const dados = {
  titulo: "Este mÃªs",
  descricao: "Novos clientes"
}
const corrigido = sanitizeUTF8Deep(dados)
```

### Retornar JSON com charset correto em APIs:

```typescript
import { apiJsonResponse, apiErrorResponse } from '@/lib/api-helpers'

export async function GET(req: Request) {
  try {
    const dados = await prisma.processo.findMany(...)
    
    // ✅ Retorna com charset UTF-8 e sanitização automática
    return apiJsonResponse(dados)
  } catch (err) {
    // ✅ Retorna erro com charset UTF-8
    return apiErrorResponse('Erro ao buscar', 500)
  }
}
```

---

## 3. CORRIGINDO DADOS EXISTENTES NO BANCO

Se há dados corrompidos no PostgreSQL (ex: "mÃªs" em vez de "mês"):

### Opção 1: Via Next.js seed script

Criar arquivo `prisma/seed-fix-encoding.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { sanitizeUTF8 } from '@/lib/utils'

async function main() {
  console.log('Corrigindo encoding UTF-8 no banco...')

  // Exemplo: corrigir tabela de clientes
  const clientes = await prisma.cliente.findMany()
  
  for (const cliente of clientes) {
    const corrigido = {
      nomeCompleto: sanitizeUTF8(cliente.nomeCompleto),
      email: sanitizeUTF8(cliente.email || ''),
      telefone: sanitizeUTF8(cliente.telefone || ''),
    }
    
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: corrigido,
    })
  }

  console.log(`✅ Corrigidos ${clientes.length} clientes`)
}

main().catch(console.error)
```

Rodar:
```bash
npx ts-node prisma/seed-fix-encoding.ts
```

### Opção 2: Via SQL direto (PostgreSQL)

```sql
-- ⚠️ Backup primeiro: pg_dump norma_db > backup.sql

-- Corrigir tabela clientes
UPDATE clientes 
SET nome_completo = convert_to(convert_from(encode(convert_to(nome_completo, 'latin1'), 'escape'), 'utf8'), 'utf8')
WHERE nome_completo LIKE '%Ã%' OR nome_completo LIKE '%ã%';

-- Verificar tabela processos
UPDATE processos
SET observacoes = convert_to(convert_from(encode(convert_to(observacoes, 'latin1'), 'escape'), 'utf8'), 'utf8')
WHERE observacoes LIKE '%Ã%';
```

---

## 4. CHECKUP: Validar se tudo está funcionando

### ✓ Testar encoding nos navegadores

1. Abrir DevTools (F12)
2. Ir para `Network` tab
3. Clicar em requisição da API
4. Checar `Response Headers`:
   ```
   Content-Type: application/json; charset=utf-8
   ```
5. Verificar na aba `Response` se textos aparecem corretos (sem "Ã")

### ✓ Testar modais

1. Abrir aplicação
2. Tentar adicionar um novo Lead / Usuário / Lançamento
3. Verificar que:
   - Modal aparece centralizado
   - Não há áreas pretas/brancas cobrindo a tela
   - Sidebar permanece visível
   - Modal é responsivo em mobile
   - Botões funcionam corretamente

### ✓ Testar em diferentes páginas

- `/dashboard` - verificar Cards com dados
- `/processos` - clicar "Editar" para abrir modal
- `/tarefas` - clicar card para abrir Kanban
- `/comercial` - novo Lead
- `/usuarios` - novo Usuário
- `/financeiro` - novo Lançamento

---

## 5. CHECKLIST DE IMPLEMENTAÇÃO

Para aplicar em todo projeto após deploy:

- [ ] Implementar `apiJsonResponse` e `apiErrorResponse` em todas APIs
- [ ] Adicionar `sanitizeUTF8Deep()` ao retornar dados do backend
- [ ] Corrigir dados existentes no banco usando seed ou SQL
- [ ] Testar todas as páginas com dados que contêm acentuação
- [ ] Validar charset em devtools
- [ ] Testar modais em mobile (responsividade)
- [ ] Testar modais com formulários grandes (scroll interno)

---

## 6. PROBLEMAS CONHECIDOS & SOLUÇÕES

### Problema: "mÃªs" continua aparecendo
**Solução:**
1. Verificar Source of Truth - Banco de dados ou API?
2. Se do banco: rodar migration/seed de correção
3. Se da API: garantir `apiJsonResponse()` está sendo usado
4. Limpar cache do navegador (Ctrl+Shift+Delete)

### Problema: Modal não abre no mobile
**Solução:**
1. Verificar classe `.modal-overlay` em `globals.css`
2. Garantir que `position: fixed` está aplicado
3. Testar com `max-width: 100%` em `.modal-content`

### Problema: Modal com scroll fica cortado
**Solução:**
1. Usar `.modal-body` em vez de `.p-6` direto
2. Adicionar `.modal-footer` em vez de `.flex gap-3 mt-6`
3. Verify no DevTools que overflow está `auto` não `hidden`

---

## 7. REFERÊNCIA DE CLASSES CSS

No `globals.css`:

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 32rem;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  animation: modalEnter 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.modal-content.lg {
  max-width: 42rem; /* Para formulários maiores */
}

.modal-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--surface);
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: flex-end;
}
```

---

## Próximos Passos

1. ✅ Deploy das correções
2. ✅ Rodar migration de encoding no banco
3. ✅ Testar em produção
4. ✅ Monitorar logs de erro
5. ✅ Educar equipe sobre novo padrão
