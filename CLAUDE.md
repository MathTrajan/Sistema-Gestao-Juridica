# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

The UI uses a dark glassmorphism aesthetic defined in `norma/src/app/globals.css`. Core principles:

**Color palette**
- Background: `#0a0e1a → #1a1f3a` gradient (fixed, full-viewport)
- Primary accent: Gold `#d4af37` / `#e8c84a` — used for active states, CTAs, progress
- Secondary accent: Indigo `#6366f1` / `#818cf8` — used for focus rings, gradients
- Status colors: success `#10b981`, warning amber, danger red (see CSS variables)

**Glass card pattern** (`.glass-card` class)
- `backdrop-filter: blur(24px)` + semi-transparent background
- `::before` pseudo-element creates a gold shimmer on hover
- Always use `.glass-card` on content containers — never plain `bg-surface`
- Hover state adds gold border `rgba(212,175,55,0.22)` + glow

**Animation utilities in `globals.css`**
- `.page-enter` — fade + slide-up on page load (add to every top-level page wrapper `<div>`)
- `.hover-lift` — translateY(-5px) + glow on hover (stat cards, list cards)
- `.skeleton-shimmer` — shimmer loading state
- `.gradient-text` / `.gradient-text-gold` — gradient clipped text
- `.badge-pulse-gold/danger/success` — pulsing glow for alert badges
- Stagger children: `.stagger-children` with `> *:nth-child(n)` delay utilities

**Component conventions**
- `StatCard` accepts `progress?: number` (0–100) and `badge?: {text, variant}` — always pass these for dashboard metrics
- `GlassCard` wraps any section with a header + optional badge
- `AnimatedChart` renders an AreaChart (default) or BarChart — uses recharts with custom gold tooltip
- `ParticlesBackground` renders 32 animated gold particles — included in dashboard layout and login
- `DashboardSkeleton` / `TableRowSkeleton` / `CardSkeleton` — use these in `loading.tsx` files

**Mini stat cards in list pages** (processos, prazos, etc.)
Use `motion.div` with `glass-card hover-lift rounded-3xl` + inline `style` for colored icon + gradient text on the value. Follow the pattern in `ProcessosClient.tsx` and `PrazosClient.tsx`.

**Modals**
Use `motion.div` with `AnimatePresence`, `backdrop-filter: blur(8px)` overlay, and spring animation `{ type: 'spring', stiffness: 400, damping: 28 }`. See `PrazosClient.tsx` for the reference implementation.

## Frontend patterns

**Page wrapper** — every `(dashboard)` page's top-level `<div>` must have `className="page-enter px-6 py-8 xl:px-10"`.

**Server vs client split** — pages are server components (Prisma → props); interactive parts live in `src/components/<module>/Client.tsx`. Client components use `useState` + `fetch`, not React Query.

**Framer Motion** — imported from `framer-motion` throughout. Use `motion.div` with `initial/animate/transition` for list items and cards. Use `layoutId="sidebar-indicator"` only for the sidebar active indicator.

**Typography scale**
- Page subtitle: `text-[10px] uppercase tracking-[0.36em] text-slate-500`
- Card label: `text-[11px] font-semibold uppercase tracking-[0.28em]`
- Stat value: `text-3xl font-bold` with gradient text
- Table header: `text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground`

## Brand assets

Logos live in `LogoMarca/`:
- `LOGO GG_FULL.png` — full logo (light background)
- `LOGO GG_FULL TRANSP.png` — full logo with transparent background
- `LOGO GG_ICONE.png` — icon only
- `LOGO GG_full dark (1).png` / `LOGO GG_ICONE DARK.png` — dark variants

The sidebar currently uses a `⚖` emoji placeholder with gold gradient background. Replace with `LOGO GG_ICONE DARK.png` when integrating the actual logo image.

## Visual reference

`ModeloV2/dashboard.html` is the canonical HTML prototype for color values, animation keyframes, and interaction patterns. Read it when in doubt about a visual decision. `Captura de tela 2026-05-06 131340.png` at the repo root shows the target dashboard appearance.

## Known pre-existing TypeScript errors (do not fix unless explicitly asked)

These errors existed before and are unrelated to UI work:
- `session` possibly null in several page files (safe — middleware guarantees auth)
- `prazo`/`responsavel`/`processo` on tarefas type (Prisma include mismatch)
- `recorrente` on financeiro Lancamento type
- `statusSummary.variant` inferred as `string` instead of literal union
