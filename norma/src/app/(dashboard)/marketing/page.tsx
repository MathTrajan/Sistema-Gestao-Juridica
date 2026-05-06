import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const origemLabels: Record<string, string> = {
  INDICACAO:  'Indicação',
  SITE:       'Site',
  INSTAGRAM:  'Instagram',
  FACEBOOK:   'Facebook',
  GOOGLE:     'Google',
  WHATSAPP:   'WhatsApp',
  EVENTO:     'Evento',
  OUTRO:      'Outro',
}

const temperaturaConfig: Record<string, { label: string; bg: string; color: string }> = {
  QUENTE: { label: 'Quente', bg: 'var(--red-light)',   color: 'var(--red)'   },
  MORNO:  { label: 'Morno',  bg: 'var(--amber-light)', color: 'var(--amber)' },
  FRIO:   { label: 'Frio',   bg: 'var(--blue-light)',  color: 'var(--blue)'  },
}

const etapaLabels: Record<string, string> = {
  NOVO_CONTATO:      'Novo Contato',
  EM_NEGOCIACAO:     'Em Negociação',
  PROPOSTA_ENVIADA:  'Proposta Enviada',
  CONVERTIDO:        'Convertido',
  PERDIDO:           'Perdido',
}

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow)',
} as const

export default async function MarketingPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [leadsRaw, leadsNovos] = await Promise.all([
    prisma.lead.findMany({
      where: { escritorioId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.lead.count({ where: { escritorioId, createdAt: { gte: inicioMes } } }),
  ])

  const total       = leadsRaw.length
  const quentes     = leadsRaw.filter(l => l.temperatura === 'QUENTE').length
  const convertidos = leadsRaw.filter(l => l.etapa === 'CONVERTIDO').length
  const perdidos    = leadsRaw.filter(l => l.etapa === 'PERDIDO').length
  const taxaConversao = total > 0 ? Math.round((convertidos / total) * 100) : 0

  const porOrigem: Record<string, number> = {}
  for (const lead of leadsRaw) {
    const orig = (lead.origem as string) || 'OUTRO'
    porOrigem[orig] = (porOrigem[orig] || 0) + 1
  }
  const origemSorted = Object.entries(porOrigem).sort((a, b) => b[1] - a[1])

  const thStyle: React.CSSProperties = {
    textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text3)',
    letterSpacing: '0.5px', textTransform: 'uppercase', padding: '10px 16px',
    borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ padding: '28px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total de Leads',  value: total,       color: 'var(--accent2)', bg: 'var(--accent-light)', sub: leadsNovos > 0 ? `↑ ${leadsNovos} este mês` : 'Nenhum novo este mês' },
          { label: 'Leads Quentes',   value: quentes,     color: 'var(--red)',     bg: 'var(--red-light)',    sub: 'Prontos para converter' },
          { label: 'Convertidos',     value: convertidos, color: 'var(--gold)',    bg: 'var(--gold-light)',   sub: `${taxaConversao}% de conversão` },
          { label: 'Perdidos',        value: perdidos,    color: 'var(--text3)',   bg: 'var(--surface2)',     sub: `${total > 0 ? Math.round((perdidos / total) * 100) : 0}% do total` },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 600, color: s.color, margin: '6px 0 4px', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* grid-main-aside */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>

        {/* Tabela de leads */}
        <div style={card}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Leads Recentes</span>
          </div>
          {leadsRaw.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              Nenhum lead cadastrado ainda. Acesse <strong>Comercial / CRM</strong> para adicionar.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Contato</th>
                    <th style={thStyle}>Origem</th>
                    <th style={thStyle}>Etapa</th>
                    <th style={thStyle}>Temp.</th>
                  </tr>
                </thead>
                <tbody>
                  {leadsRaw.map(lead => {
                    const temp = temperaturaConfig[lead.temperatura as string]
                    const etapa = etapaLabels[lead.etapa as string] ?? lead.etapa
                    return (
                      <tr key={lead.id} style={{ borderBottom: '1px solid var(--surface2)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 500 }}>{lead.nome}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{lead.telefone || '—'}</div>
                          {lead.email && <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{lead.email}</div>}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text2)' }}>
                          {origemLabels[lead.origem as string] ?? lead.origem ?? '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: 'var(--surface2)', color: 'var(--text2)' }}>
                            {etapa}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {temp && (
                            <span style={{ fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px', background: temp.bg, color: temp.color }}>
                              {temp.label}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Captação por canal */}
        <div style={card}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Captação por Canal</span>
          </div>
          {origemSorted.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>
              Sem dados de origem
            </div>
          ) : (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {origemSorted.map(([orig, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={orig}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{origemLabels[orig] ?? orig}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent3)', borderRadius: '3px' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
