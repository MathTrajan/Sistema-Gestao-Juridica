# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto do Projeto

> Gerado por /mapa em 2026-05-08. Grafo completo: `G:\Meu Drive\Obsidian Vault\Graphify\Sistema-Gestao-Jurídico\graphify-out\GRAPH_REPORT.md`

### Núcleo do sistema (god nodes)
- `norma/CLAUDE.md` — 16 conexões — hub de toda a arquitetura da app
- `Framer Motion` — 12 conexões — ponte entre Design System, Layout, Dashboard e Kanban
- `Root CLAUDE.md` — 11 conexões — ancora design system + padrões frontend
- `Encoding Modal Fix Guide` — 10 conexões — documenta a correção UTF-8 e refactor de modais
- `PUT()` / `guardArea()` — 9 conexões cada — núcleo das rotas de escrita e controle de acesso

### Comunidades
| ID | Nome |
|---|---|
| C1 | Encoding Fix & Client Components |
| C2 | API Route Handlers |
| C3 | Design System & Docs |
| C4 | Layout & Sidebar Navigation |
| C5 | UTF-8 Encoding Repair |
| C6 | Dashboard Data & Analytics |
| C8 | API Response Helpers |
| C10 | Brazilian Document Formatters |
| C11 | Middleware & Rate Limiting |
| C12–C23 | Formulários por módulo (um cluster por form) |
| C57–C76 | Config, auth, schemas, rotas isoladas |

### Conexões não óbvias
- Os ícones da marca (`icon.png`, `icon dark.png`, `logo-norma-icon.png`) conectam-se ao Gold Color Palette — identidade visual é estruturalmente atada ao design system, não apenas documentação
- `fixClientesEncoding()` → `sanitizeUTF8()` — o script de seed repair usa a mesma função utilitária que os helpers de API em runtime; corrigir um afeta o outro
- `Prisma Seed Fix Encoding` → `Prisma ORM (Neon)` — o script de reparo de encoding é uma operação direta no banco, não uma rota — requer `DIRECT_URL`, não `DATABASE_URL`

## Repository layout

```
Sistema-Gestao-Jurídico/
├── norma/          ← production Next.js app (all coding happens here)
├── ModeloV2/       ← HTML/CSS prototype (visual reference only — do not run)
├── LogoMarca/      ← official brand assets (PNG/PDF)
└── Docs/           ← requirements documentation
```

**All development work is inside `norma/`.** See `norma/CLAUDE.md` for commands, architecture, auth, RBAC, and API patterns.

## Design system

The UI uses a dark glassmorphism aesthetic defined in `norma/src/app/globals.css`.

**Color palette (CSS variables in `:root`)**
- Background: `--bg: #0D0D0D`, surface cards: `--surface: #161616`
- Primary accent — Gold: `--gold: #B8962A`, gradient buttons use `linear-gradient(135deg, #d4af37, #B8962A)`
- Status: `--success: #22C55E`, `--warning: #F59E0B`, `--danger: #EF4444`, `--info: #3B82F6`
- Status backgrounds: `--success-bg`, `--warning-bg`, `--danger-bg`, `--info-bg` (10–15% opacity variants)

**Dark card / input pattern** (use these everywhere, not `bg-white` or `border-gray-*`)
```tsx
// Section card
"rounded-xl border border-white/10 bg-white/5 p-6"

// Input / select / textarea
"w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"

// Label
"block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground"

// Gold CTA button (text must be text-black, not text-white)
style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
className="... text-black font-semibold ..."

// Cancel / secondary button
"... text-muted-foreground border border-white/10 bg-white/5 hover:bg-white/10 ..."
```

**Modal pattern**
- Overlay: `style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}`
- Container: `rounded-2xl border border-white/10` + `style={{ background: '#161616' }}`
- Sticky header uses same `#161616` background
- For animated modals, use `motion.div` with `AnimatePresence` and spring `{ type: 'spring', stiffness: 400, damping: 28 }` — see `PrazosClient.tsx`

**Status / badge colors**
```tsx
// Error message block
"rounded-lg border border-red-400/30 bg-red-400/10 text-red-400"
// Success message block
"rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
// Status badge (ativo)
"bg-emerald-400/15 text-emerald-400"
// Temperatura quente/morno/frio
"bg-red-400/15 text-red-400" / "bg-amber-400/15 text-amber-400" / "bg-blue-400/15 text-blue-400"
```

**Glass card pattern** (`.glass-card` class)
- `background: var(--surface)` + `border: 1px solid var(--border)` + `box-shadow: 0 4px 24px rgba(0,0,0,0.5)`
- `::before` pseudo-element creates a gold top-shimmer on hover
- Always use `.glass-card` on main content containers — never plain `bg-surface`

**Animation utilities in `globals.css`**
- `.page-enter` — fade + slide-up on page load — add to every top-level page wrapper `<div>`
- `.hover-lift` — translateY(-5px) + gold glow on hover (stat cards, list cards)
- `.skeleton-shimmer` — shimmer loading state
- `.gradient-text` / `.gradient-text-gold` — gradient clipped text
- `.badge-pulse-gold/danger/success` — pulsing glow for alert badges
- `.stagger-children` with `> *:nth-child(n)` delay utilities

**Component conventions**
- `StatCard` accepts `progress?: number` (0–100) and `badge?: {text, variant}` — always pass these for dashboard metrics
- `GlassCard` wraps any section with a header + optional badge
- `AnimatedChart` renders an AreaChart (default) or BarChart with custom gold tooltip
- `ParticlesBackground` renders 32 animated gold particles — included in dashboard layout and login
- `DashboardSkeleton` / `TableRowSkeleton` / `CardSkeleton` — use these in `loading.tsx` files

**Mini stat cards in list pages** (processos, prazos, etc.)
Use `motion.div` with `glass-card hover-lift rounded-3xl` + inline `style` for colored icon + gradient text on the value. Follow the pattern in `ProcessosClient.tsx` and `PrazosClient.tsx`.

## Frontend patterns

**Page wrapper** — every `(dashboard)` page's top-level `<div>` must have `className="page-enter px-6 py-8 xl:px-10"`.

**Server vs client split** — pages are server components (Prisma → props); interactive parts live in `src/components/<module>/Client.tsx`. Client components use `useState` + `fetch`, not React Query.

**Responsive tables** — never use fixed `min-w-[*px]` on tables. Use `min-w-[480px]` max with `overflow-x-auto` wrapper, and hide lower-priority columns with `hidden sm:table-cell`, `hidden md:table-cell`, `hidden lg:table-cell`.

**Framer Motion** — use `motion.div` with `initial/animate/transition` for list items and cards. Use `layoutId="sidebar-indicator"` only for the sidebar active indicator.

**Typography scale**
- Page subtitle: `text-[10px] uppercase tracking-[0.36em] text-slate-500`
- Card label: `text-[11px] font-semibold uppercase tracking-[0.28em]`
- Stat value: `text-3xl font-bold` with gradient text
- Table header: `text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground`

**Checkboxes / radios** — always use `accent-[#B8962A]` instead of `accent-green-*`.

## Brand assets

Logos live in `LogoMarca/`:
- `LOGO GG_FULL.png` — full logo (light background)
- `LOGO GG_FULL TRANSP.png` — full logo with transparent background
- `LOGO GG_ICONE.png` — icon only
- `LOGO GG_full dark (1).png` / `LOGO GG_ICONE DARK.png` — dark variants

The sidebar currently uses a `⚖` emoji placeholder. Replace with `LOGO GG_ICONE DARK.png` when integrating the actual logo.

## Visual reference

`ModeloV2/dashboard.html` is the canonical HTML prototype for color values, animation keyframes, and interaction patterns. Read it when in doubt about a visual decision.

## Known pre-existing TypeScript errors (do not fix unless explicitly asked)

- `session` possibly null in several page files — safe, middleware guarantees auth
- `prazo`/`responsavel`/`processo` on tarefas type — Prisma include mismatch
- `recorrente` on financeiro Lancamento type
- `statusSummary.variant` inferred as `string` instead of literal union
