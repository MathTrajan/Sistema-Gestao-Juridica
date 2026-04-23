import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { FileText, Users, CheckSquare, DollarSign, TrendingUp, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const session = await auth()
  const escritorioId = (session?.user as any)?.escritorioId

  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  const [
    totalProcessos,
    processosEncerrados,
    processosNovos,
    totalClientes,
    clientesNovos,
    tarefasConcluidas,
    tarefasPendentes,
    prazosTotal,
    prazosCumpridos,
    prazosPerdidos,
    receitaTotal,
    despesaTotal,
    receitaMes,
    leads,
    leadsConvertidos,
  ] = await Promise.all([
    prisma.processo.count({ where: { escritorioId } }),
    prisma.processo.count({ where: { escritorioId, status: { in: ['ENCERRADO_PROCEDENTE', 'ENCERRADO_IMPROCEDENTE', 'ARQUIVADO'] } } }),
    prisma.processo.count({ where: { escritorioId, createdAt: { gte: inicioMes } } }),
    prisma.cliente.count({ where: { escritorioId } }),
    prisma.cliente.count({ where: { escritorioId, createdAt: { gte: inicioMes } } }),
    prisma.tarefa.count({ where: { escritorioId, status: 'CONCLUIDO' } }),
    prisma.tarefa.count({ where: { escritorioId, status: { in: ['A_FAZER', 'EM_ANDAMENTO'] } } }),
    prisma.prazo.count({ where: { processo: { escritorioId } } }),
    prisma.prazo.count({ where: { processo: { escritorioId }, status: 'CUMPRIDO' } }),
    prisma.prazo.count({ where: { processo: { escritorioId }, status: 'PERDIDO' } }),
    prisma.lancamento.aggregate({ where: { escritorioId, tipo: 'ENTRADA', status: 'PAGO' }, _sum: { valor: true } }),
    prisma.lancamento.aggregate({ where: { escritorioId, tipo: 'SAIDA', status: 'PAGO' }, _sum: { valor: true } }),
    prisma.lancamento.aggregate({ where: { escritorioId, tipo: 'ENTRADA', status: 'PAGO', createdAt: { gte: inicioMes } }, _sum: { valor: true } }),
    prisma.lead.count({ where: { escritorioId } }),
    prisma.lead.count({ where: { escritorioId, etapa: 'CONVERTIDO' } }),
  ])

  const receita = Number(receitaTotal._sum.valor || 0)
  const despesa = Number(despesaTotal._sum.valor || 0)
  const receitaMesNum = Number(receitaMes._sum.valor || 0)
  const taxaPrazos = prazosTotal > 0 ? Math.round((prazosCumpridos / prazosTotal) * 100) : 0
  const taxaConversao = leads > 0 ? Math.round((leadsConvertidos / leads) * 100) : 0

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const cards = [
    {
      titulo: 'Processos', icon: FileText, color: 'bg-blue-50 text-blue-700',
      items: [
        { label: 'Total de processos', valor: totalProcessos },
        { label: 'Em andamento', valor: totalProcessos - processosEncerrados },
        { label: 'Encerrados', valor: processosEncerrados },
        { label: 'Novos este mês', valor: processosNovos },
      ],
    },
    {
      titulo: 'Clientes', icon: Users, color: 'bg-green-50 text-green-700',
      items: [
        { label: 'Total de clientes', valor: totalClientes },
        { label: 'Novos este mês', valor: clientesNovos },
        { label: 'Leads totais', valor: leads },
        { label: 'Taxa de conversão', valor: `${taxaConversao}%` },
      ],
    },
    {
      titulo: 'Tarefas', icon: CheckSquare, color: 'bg-amber-50 text-amber-700',
      items: [
        { label: 'Concluídas', valor: tarefasConcluidas },
        { label: 'Pendentes', valor: tarefasPendentes },
        { label: 'Total de prazos', valor: prazosTotal },
        { label: 'Taxa cumprimento', valor: `${taxaPrazos}%` },
      ],
    },
    {
      titulo: 'Prazos', icon: Clock, color: 'bg-red-50 text-red-700',
      items: [
        { label: 'Total cadastrados', valor: prazosTotal },
        { label: 'Cumpridos', valor: prazosCumpridos },
        { label: 'Perdidos', valor: prazosPerdidos },
        { label: 'Taxa cumprimento', valor: `${taxaPrazos}%` },
      ],
    },
    {
      titulo: 'Financeiro', icon: DollarSign, color: 'bg-purple-50 text-purple-700',
      items: [
        { label: 'Receita total', valor: fmt(receita) },
        { label: 'Despesas total', valor: fmt(despesa) },
        { label: 'Resultado líquido', valor: fmt(receita - despesa) },
        { label: 'Receita este mês', valor: fmt(receitaMesNum) },
      ],
    },
    {
      titulo: 'Comercial', icon: TrendingUp, color: 'bg-pink-50 text-pink-700',
      items: [
        { label: 'Leads captados', valor: leads },
        { label: 'Convertidos', valor: leadsConvertidos },
        { label: 'Taxa de conversão', valor: `${taxaConversao}%` },
        { label: 'Perdidos', valor: leads - leadsConvertidos },
      ],
    },
  ]

  return (
    <div className="p-8">

      {/* Resumo executivo */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{totalProcessos}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Processos totais</div>
          <div className="text-xs text-green-600 mt-1">+{processosNovos} este mês</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-green-700">{fmt(receita)}</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Receita total</div>
          <div className="text-xs text-green-600 mt-1">{fmt(receitaMesNum)} este mês</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{taxaPrazos}%</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Cumprimento de prazos</div>
          <div className="text-xs text-gray-400 mt-1">{prazosCumpridos} de {prazosTotal}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{taxaConversao}%</div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide font-medium">Conversão de leads</div>
          <div className="text-xs text-gray-400 mt-1">{leadsConvertidos} de {leads}</div>
        </div>
      </div>

      {/* Cards de indicadores */}
      <div className="grid grid-cols-3 gap-6">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.titulo} className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={14} />
                </div>
                <span className="font-semibold text-gray-900 text-sm">{card.titulo}</span>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-3">
                  {card.items.map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">{item.valor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}