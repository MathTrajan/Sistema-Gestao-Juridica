'use client'

import { useState } from 'react'
import { Plus, Trash2, Power, Check, X, Loader2, RefreshCw, Pencil } from 'lucide-react'
import { toast } from 'sonner'

// Lista enxuta de tribunais — espelha o que existe em AdvogadoSearchClient
// mas só os que realmente atendem advogados em volume (TJs principais, TRFs,
// TRT-GO, superiores). O usuário pode editar via API direta se precisar.
const TRIBUNAIS = [
  { value: 'TJGO',  label: 'TJGO — Goiás' },
  { value: 'TJSP',  label: 'TJSP — São Paulo' },
  { value: 'TJRJ',  label: 'TJRJ — Rio de Janeiro' },
  { value: 'TJMG',  label: 'TJMG — Minas Gerais' },
  { value: 'TJRS',  label: 'TJRS — Rio Grande do Sul' },
  { value: 'TJPR',  label: 'TJPR — Paraná' },
  { value: 'TJBA',  label: 'TJBA — Bahia' },
  { value: 'TJSC',  label: 'TJSC — Santa Catarina' },
  { value: 'TJPE',  label: 'TJPE — Pernambuco' },
  { value: 'TJDFT', label: 'TJDFT — Distrito Federal' },
  { value: 'TRF1',  label: 'TRF1 — Federal 1ª' },
  { value: 'TRF2',  label: 'TRF2 — Federal 2ª' },
  { value: 'TRF3',  label: 'TRF3 — Federal 3ª' },
  { value: 'TRF4',  label: 'TRF4 — Federal 4ª' },
  { value: 'TRF5',  label: 'TRF5 — Federal 5ª' },
  { value: 'TRF6',  label: 'TRF6 — Federal 6ª' },
  { value: 'TRT18', label: 'TRT18 — Trabalho GO' },
  { value: 'STJ',   label: 'STJ' },
  { value: 'TST',   label: 'TST' },
]

interface Monitorado {
  id: string
  oab: string
  nome: string | null
  tribunais: string[]
  ativo: boolean
  ultimaVerificacaoAt: string | null
  ultimoResultadoCount: number | null
  createdAt: string
  usuario: { id: string; nome: string } | null
}

interface Props {
  initial: Monitorado[]
}

function fmtDataHora(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MonitoramentoClient({ initial }: Props) {
  const [itens, setItens] = useState<Monitorado[]>(initial)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [verificandoId, setVerificandoId] = useState<string | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editTribunais, setEditTribunais] = useState<string[]>([])
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [oab, setOab] = useState('')
  const [nome, setNome] = useState('')
  const [tribunaisSelecionados, setTribunaisSelecionados] = useState<string[]>([
    'TJGO',
  ])

  async function salvarNovo() {
    if (!oab.trim()) {
      toast.error('Informe a OAB')
      return
    }
    if (tribunaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um tribunal')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/advogados-monitorados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oab: oab.trim(),
          nome: nome.trim() || null,
          tribunais: tribunaisSelecionados,
          ativo: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao salvar')
        return
      }
      setItens([{ ...data, usuario: null }, ...itens])
      setCriando(false)
      setOab('')
      setNome('')
      setTribunaisSelecionados(['TJGO'])
      toast.success('Advogado adicionado ao monitoramento')
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(item: Monitorado) {
    const novoAtivo = !item.ativo
    setItens(itens.map((i) => (i.id === item.id ? { ...i, ativo: novoAtivo } : i)))
    try {
      const res = await fetch(`/api/advogados-monitorados/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: novoAtivo }),
      })
      if (!res.ok) throw new Error()
      toast.success(novoAtivo ? 'Monitoramento ativado' : 'Monitoramento pausado')
    } catch {
      setItens(itens) // rollback
      toast.error('Erro ao atualizar')
    }
  }

  async function verificarAgora(item: Monitorado) {
    if (!item.ativo) {
      toast.error('Ative o monitoramento antes de verificar')
      return
    }
    setVerificandoId(item.id)
    try {
      const res = await fetch(
        `/api/advogados-monitorados/${item.id}/verificar`,
        { method: 'POST' }
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao verificar')
        return
      }

      // Atualiza o item localmente com a nova hora de verificação
      setItens((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                ultimaVerificacaoAt: new Date().toISOString(),
                ultimoResultadoCount: data.totalEncontrados,
              }
            : i
        )
      )

      const errosCount = data.errosPorTribunal?.length ?? 0
      const totalTribunais = item.tribunais.length
      const todosFalharam = errosCount > 0 && errosCount >= totalTribunais

      if (todosFalharam) {
        // Não mostra "nenhum encontrado" se nem chegou a consultar
        const lista = data.errosPorTribunal
          .map((e: any) => e.tribunal)
          .join(', ')
        toast.error(`Não foi possível consultar o DataJud (${lista}). Tente novamente em alguns minutos.`)
      } else if (data.descobertos > 0) {
        toast.success(data.mensagem, { duration: 5000 })
        if (errosCount > 0) {
          const lista = data.errosPorTribunal.map((e: any) => e.tribunal).join(', ')
          toast.warning(`Falha parcial: ${lista}`)
        }
      } else {
        toast.info(data.mensagem)
        if (errosCount > 0) {
          const lista = data.errosPorTribunal.map((e: any) => e.tribunal).join(', ')
          toast.warning(`Falha parcial: ${lista}`)
        }
      }
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setVerificandoId(null)
    }
  }

  function iniciarEdicao(item: Monitorado) {
    setEditandoId(item.id)
    setEditNome(item.nome ?? '')
    setEditTribunais([...item.tribunais])
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setEditNome('')
    setEditTribunais([])
  }

  function toggleEditTribunal(value: string) {
    setEditTribunais((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  async function salvarEdicao(item: Monitorado) {
    if (editTribunais.length === 0) {
      toast.error('Selecione ao menos um tribunal')
      return
    }
    setSalvandoEdicao(true)
    try {
      const res = await fetch(`/api/advogados-monitorados/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome.trim() || null,
          tribunais: editTribunais,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao salvar')
        return
      }
      setItens((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, nome: editNome.trim() || null, tribunais: editTribunais }
            : i
        )
      )
      cancelarEdicao()
      toast.success('Alterações salvas')
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSalvandoEdicao(false)
    }
  }

  async function remover(item: Monitorado) {
    if (!confirm(`Remover monitoramento da OAB ${item.oab}?`)) return
    const anteriores = itens
    setItens(itens.filter((i) => i.id !== item.id))
    try {
      const res = await fetch(`/api/advogados-monitorados/${item.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      toast.success('Removido')
    } catch {
      setItens(anteriores)
      toast.error('Erro ao remover')
    }
  }

  function toggleTribunal(value: string) {
    setTribunaisSelecionados((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    )
  }

  return (
    <div className="space-y-4">
      {/* Botão de adicionar / formulário */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        {!criando ? (
          <button
            onClick={() => setCriando(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all"
            style={{
              background: 'linear-gradient(135deg, #d4af37, #B8962A)',
              boxShadow: '0 0 22px rgba(200,155,60,0.3)',
            }}
          >
            <Plus size={14} />
            Adicionar OAB ao monitoramento
          </button>
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Nova OAB monitorada
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
                  OAB <span className="text-red-400">*</span>
                </label>
                <input
                  value={oab}
                  onChange={(e) => setOab(e.target.value)}
                  placeholder='Ex: "GO12345" ou apenas "12345"'
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
                  Nome (opcional)
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome do advogado (ajuda a filtrar)"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
                Tribunais a monitorar <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {TRIBUNAIS.map((t) => {
                  const ativo = tribunaisSelecionados.includes(t.value)
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleTribunal(t.value)}
                      className={
                        'rounded-lg border px-2 py-1.5 text-xs font-medium transition ' +
                        (ativo
                          ? 'border-[rgba(184,150,42,0.5)] bg-[rgba(184,150,42,0.15)] text-[#d4af37]'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10')
                      }
                    >
                      {ativo && <Check size={11} className="mr-1 inline" />}
                      {t.value}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Quanto mais tribunais, mais consultas o cron faz por dia. Para uso
                normal, 1-3 tribunais é suficiente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={salvarNovo}
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
              >
                {salvando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Salvar
              </button>
              <button
                onClick={() => {
                  setCriando(false)
                  setOab('')
                  setNome('')
                  setTribunaisSelecionados(['TJGO'])
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/10"
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de monitorados */}
      <div className="rounded-3xl border border-white/10 bg-white/5">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            OABs monitoradas ({itens.length})
          </h2>
        </div>
        {itens.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Nenhuma OAB cadastrada ainda. Adicione uma para começar a receber
            notificações.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {itens.map((item) =>
              editandoId === item.id ? (
                // ─── Modo edição ───────────────────────────────────────────
                <div key={item.id} className="space-y-4 px-6 py-5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      Editando OAB {item.oab}
                    </span>
                    <span className="rounded-full bg-[rgba(184,150,42,0.15)] px-2 py-0.5 text-[10px] font-medium text-[#d4af37]">
                      o número da OAB não pode ser alterado
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1 text-muted-foreground">
                      Nome (opcional)
                    </label>
                    <input
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      placeholder="Nome do advogado (ajuda a filtrar)"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition focus:border-[rgba(184,150,42,0.4)] focus:bg-white/[0.08]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground">
                      Tribunais a monitorar <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {TRIBUNAIS.map((t) => {
                        const ativo = editTribunais.includes(t.value)
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => toggleEditTribunal(t.value)}
                            className={
                              'rounded-lg border px-2 py-1.5 text-xs font-medium transition ' +
                              (ativo
                                ? 'border-[rgba(184,150,42,0.5)] bg-[rgba(184,150,42,0.15)] text-[#d4af37]'
                                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10')
                            }
                          >
                            {ativo && <Check size={11} className="mr-1 inline" />}
                            {t.value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => salvarEdicao(item)}
                      disabled={salvandoEdicao}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-black transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #d4af37, #B8962A)' }}
                    >
                      {salvandoEdicao ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Salvar
                    </button>
                    <button
                      onClick={cancelarEdicao}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition hover:bg-white/10"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // ─── Modo lista ────────────────────────────────────────────
                <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        OAB {item.oab}
                      </span>
                      {item.nome && (
                        <span className="text-xs text-muted-foreground">— {item.nome}</span>
                      )}
                      {!item.ativo && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          pausado
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tribunais.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-medium text-blue-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Última verificação: {fmtDataHora(item.ultimaVerificacaoAt)}
                      {item.ultimoResultadoCount != null && (
                        <> · {item.ultimoResultadoCount} processo(s) encontrado(s)</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => verificarAgora(item)}
                      disabled={!item.ativo || verificandoId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(184,150,42,0.4)] bg-[rgba(184,150,42,0.1)] px-3 py-2 text-xs font-semibold text-[#d4af37] transition hover:bg-[rgba(184,150,42,0.18)] disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Consultar DataJud agora (sem esperar o cron diário)"
                    >
                      <RefreshCw
                        size={12}
                        className={verificandoId === item.id ? 'animate-spin' : ''}
                      />
                      {verificandoId === item.id ? 'Verificando...' : 'Verificar agora'}
                    </button>
                    <button
                      onClick={() => iniciarEdicao(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleAtivo(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10"
                      title={item.ativo ? 'Pausar monitoramento' : 'Ativar monitoramento'}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      onClick={() => remover(item)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/10 text-red-400 transition hover:bg-red-400/20"
                      title="Remover"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}
