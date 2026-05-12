'use client'

import { useState } from 'react'
import { Search, FileSearch, AlertCircle, Info, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import type { DataJudProcesso } from '@/lib/datajud'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]'
const labelClass =
  'block text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-2'

function fmtData(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDataHora(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const TRIBUNAIS = [
  { label: 'TJGO — Goiás (padrão)',                       value: 'TJGO' },
  { label: 'TJSP — São Paulo',                            value: 'TJSP' },
  { label: 'TJRJ — Rio de Janeiro',                       value: 'TJRJ' },
  { label: 'TJMG — Minas Gerais',                        value: 'TJMG' },
  { label: 'TJRS — Rio Grande do Sul',                    value: 'TJRS' },
  { label: 'TJPR — Paraná',                              value: 'TJPR' },
  { label: 'TJBA — Bahia',                               value: 'TJBA' },
  { label: 'TJSC — Santa Catarina',                      value: 'TJSC' },
  { label: 'TJPE — Pernambuco',                          value: 'TJPE' },
  { label: 'TJCE — Ceará',                               value: 'TJCE' },
  { label: 'TJPA — Pará',                                value: 'TJPA' },
  { label: 'TJMT — Mato Grosso',                         value: 'TJMT' },
  { label: 'TJMS — Mato Grosso do Sul',                  value: 'TJMS' },
  { label: 'TJMA — Maranhão',                            value: 'TJMA' },
  { label: 'TJES — Espírito Santo',                      value: 'TJES' },
  { label: 'TJRN — Rio Grande do Norte',                 value: 'TJRN' },
  { label: 'TJPI — Piauí',                               value: 'TJPI' },
  { label: 'TJPB — Paraíba',                             value: 'TJPB' },
  { label: 'TJAL — Alagoas',                             value: 'TJAL' },
  { label: 'TJSE — Sergipe',                             value: 'TJSE' },
  { label: 'TJRO — Rondônia',                            value: 'TJRO' },
  { label: 'TJTO — Tocantins',                           value: 'TJTO' },
  { label: 'TJAC — Acre',                                value: 'TJAC' },
  { label: 'TJAM — Amazonas',                            value: 'TJAM' },
  { label: 'TJAP — Amapá',                               value: 'TJAP' },
  { label: 'TJRR — Roraima',                             value: 'TJRR' },
  { label: 'TJDFT — Distrito Federal',                   value: 'TJDFT' },
  { label: 'TRF1 — Federal 1ª Região',                   value: 'TRF1' },
  { label: 'TRF2 — Federal 2ª Região',                   value: 'TRF2' },
  { label: 'TRF3 — Federal 3ª Região',                   value: 'TRF3' },
  { label: 'TRF4 — Federal 4ª Região',                   value: 'TRF4' },
  { label: 'TRF5 — Federal 5ª Região',                   value: 'TRF5' },
  { label: 'TRF6 — Federal 6ª Região',                   value: 'TRF6' },
  { label: 'TRT18 — Trabalho GO',                        value: 'TRT18' },
  { label: 'TRT1',  value: 'TRT1'  }, { label: 'TRT2',  value: 'TRT2'  },
  { label: 'TRT3',  value: 'TRT3'  }, { label: 'TRT4',  value: 'TRT4'  },
  { label: 'TRT5',  value: 'TRT5'  }, { label: 'TRT6',  value: 'TRT6'  },
  { label: 'STJ — Superior Tribunal de Justiça',         value: 'STJ' },
  { label: 'TST — Superior do Trabalho',                 value: 'TST' },
  { label: 'TSE — Superior Eleitoral',                   value: 'TSE' },
  { label: 'STM — Superior Militar',                     value: 'STM' },
]

function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: 'gray' | 'gold' | 'blue' | 'green' }) {
  const styles: Record<string, string> = {
    gray:  'border-white/10 bg-white/5 text-muted-foreground',
    gold:  'border-[rgba(184,150,42,0.3)] bg-[rgba(184,150,42,0.1)] text-[#d4af37]',
    blue:  'border-blue-400/20 bg-blue-400/10 text-blue-300',
    green: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[color]}`}>
      {children}
    </span>
  )
}

function InfoField({ label, value }: { label: string; value: unknown }) {
  const display =
    value == null || value === ''
      ? '—'
      : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-1">{label}</p>
      <p className="text-sm text-foreground">{display}</p>
    </div>
  )
}

export default function AdvogadoSearchClient({
  initialTribunal = 'TJGO',
}: {
  initialOab?: string
  initialTribunal?: string
}) {
  const [numero, setNumero] = useState('')
  const [tribunal, setTribunal] = useState(initialTribunal)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<DataJudProcesso | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [movsExpandidos, setMovsExpandidos] = useState(true)

  const movimentosOrdenados = resultado
    ? [...resultado.movimentos].sort(
        (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
      )
    : []

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const n = numero.trim()
    if (!n) return

    setLoading(true)
    setError(null)
    setResultado(null)
    setNotFound(false)

    try {
      const params = new URLSearchParams({ numero: n, tribunal })
      const res = await fetch(`/api/datajud/processo?${params}`)
      const data = await res.json()

      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) { setError(data.error ?? 'Erro ao consultar DataJud'); return }

      setResultado(data.processo)
      setMovsExpandidos(true)
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Aviso */}
      <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-300/80">
        <Info size={15} className="flex-shrink-0 mt-0.5" />
        <span>
          A API pública do DataJud não expõe partes nem advogados — apenas movimentações por número de processo.
          Para monitorar processos de um advogado, cadastre-os no sistema e use o botão{' '}
          <strong className="text-amber-200">"Sincronizar DataJud"</strong> em cada processo.
        </span>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          <label className={labelClass} htmlFor="numero">Número do processo (CNJ)</label>
          <input
            id="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            className={inputClass}
            placeholder="Ex: 1064414-42.2025.4.01.3300"
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="tribunal">Tribunal</label>
          <select
            id="tribunal"
            value={tribunal}
            onChange={(e) => setTribunal(e.target.value)}
            className={inputClass}
          >
            {TRIBUNAIS.map((t) => (
              <option key={t.value} value={t.value} style={{ background: '#161616' }}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-black transition disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
          >
            {loading
              ? <><RefreshCw size={14} className="animate-spin" />Consultando...</>
              : <><Search size={14} />Consultar Movimentações</>
            }
          </button>
        </div>
      </form>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Não encontrado */}
      {notFound && (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-muted-foreground">
          Processo não encontrado no DataJud. Verifique o número CNJ e o tribunal.
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="space-y-4">

          {/* Cabeçalho */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground mb-1">Processo</p>
                <p className="text-xl font-bold text-foreground font-mono">{resultado.numeroProcesso}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge color="gold">{String(resultado.tribunal)}</Badge>
                {resultado.grau && <Badge color="gray">{String(resultado.grau)}</Badge>}
                {resultado.formato && <Badge color="gray">{String(resultado.formato)}</Badge>}
                {resultado.sistema && <Badge color="blue">{String(resultado.sistema)}</Badge>}
                {resultado.nivelSigilo === 0 && <Badge color="green">Público</Badge>}
              </div>
            </div>

            {/* Grid de metadados */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <InfoField label="Classe" value={typeof resultado.classe?.nome === 'string' ? resultado.classe.nome : resultado.classe} />
              <InfoField label="Órgão Julgador" value={typeof resultado.orgaoJulgador?.nome === 'string' ? resultado.orgaoJulgador.nome : resultado.orgaoJulgador} />
              <InfoField label="Ajuizamento" value={fmtData(resultado.dataAjuizamento)} />
              <InfoField label="Última Atualização" value={fmtDataHora(resultado.dataHoraUltimaAtualizacao)} />
            </div>

            {/* Assuntos */}
            {resultado.assuntos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-2">Assuntos</p>
                <div className="flex flex-wrap gap-2">
                  {resultado.assuntos.map((a) => (
                    <Badge key={a.codigo} color="gray">{String(a.nome)}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Movimentações */}
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => setMovsExpandidos((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileSearch size={15} style={{ color: '#B8962A' }} />
                <span className="text-sm font-semibold text-foreground">
                  Movimentações
                </span>
                <Badge color="blue">{resultado.movimentos.length}</Badge>
              </div>
              {movsExpandidos
                ? <ChevronUp size={14} className="text-muted-foreground" />
                : <ChevronDown size={14} className="text-muted-foreground" />
              }
            </button>

            {movsExpandidos && (
              <div className="border-t border-white/8 divide-y divide-white/[0.04]">
                {movimentosOrdenados.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-muted-foreground">Nenhuma movimentação disponível.</p>
                ) : (
                  movimentosOrdenados.map((mov, i) => (
                    <div key={`${mov.codigo}-${i}`} className="flex gap-4 px-5 py-3">
                      <div className="flex-shrink-0 pt-1.5">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: '#3b82f6', boxShadow: '0 0 5px rgba(59,130,246,0.4)' }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                          <p className="text-sm font-medium text-foreground">{String(mov.nome) || 'Movimentação'}</p>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {fmtDataHora(mov.dataHora)}
                          </span>
                        </div>
                        {mov.complementos.length > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {mov.complementos.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
