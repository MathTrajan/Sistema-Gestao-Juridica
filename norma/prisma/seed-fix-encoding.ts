/**
 * Script de correção de encoding UTF-8 no banco de dados
 * 
 * Uso:
 *   npx ts-node prisma/seed-fix-encoding.ts
 * 
 * ⚠️ Faça backup antes de executar!
 *    pg_dump norma_db > backup-$(date +%Y%m%d-%H%M%S).sql
 */

import { prisma } from '../src/lib/prisma'
import { sanitizeUTF8 } from '../src/lib/utils'

async function fixClientesEncoding() {
  console.log('\n📋 Corrigindo encoding em Clientes...')
  const clientes = await prisma.cliente.findMany()
  
  let corrigidos = 0
  for (const cliente of clientes) {
    const nomeFixo = sanitizeUTF8(cliente.nomeCompleto)
    const emailFixo = sanitizeUTF8(cliente.email || '')
    const telefoneFixo = sanitizeUTF8(cliente.telefone || '')
    
    const mudou = 
      nomeFixo !== cliente.nomeCompleto ||
      emailFixo !== cliente.email ||
      telefoneFixo !== cliente.telefone
    
    if (mudou) {
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          nomeCompleto: nomeFixo,
          email: emailFixo || null,
          telefone: telefoneFixo || null,
        },
      })
      corrigidos++
    }
  }
  
  console.log(`✅ Corrigidos ${corrigidos}/${clientes.length} clientes`)
}

async function fixProcessosEncoding() {
  console.log('\n📋 Corrigindo encoding em Processos...')
  const processos = await prisma.processo.findMany()
  
  let corrigidos = 0
  for (const processo of processos) {
    const numeroFixo = sanitizeUTF8(processo.numero || '')
    const tribunalFixo = sanitizeUTF8(processo.tribunal || '')
    const varaFixo = sanitizeUTF8(processo.vara || '')
    const comarcaFixo = sanitizeUTF8(processo.comarca || '')
    const tipoAcaoFixo = sanitizeUTF8(processo.tipoAcao || '')
    const observacoesFixo = sanitizeUTF8(processo.observacoes || '')
    
    const mudou =
      numeroFixo !== processo.numero ||
      tribunalFixo !== processo.tribunal ||
      varaFixo !== processo.vara ||
      comarcaFixo !== processo.comarca ||
      tipoAcaoFixo !== processo.tipoAcao ||
      observacoesFixo !== processo.observacoes
    
    if (mudou) {
      await prisma.processo.update({
        where: { id: processo.id },
        data: {
          numero: numeroFixo || null,
          tribunal: tribunalFixo || null,
          vara: varaFixo || null,
          comarca: comarcaFixo || null,
          tipoAcao: tipoAcaoFixo || null,
          observacoes: observacoesFixo || null,
        },
      })
      corrigidos++
    }
  }
  
  console.log(`✅ Corrigidos ${corrigidos}/${processos.length} processos`)
}

async function fixLancamentosEncoding() {
  console.log('\n📋 Corrigindo encoding em Lançamentos...')
  const lancamentos = await prisma.lancamento.findMany()
  
  let corrigidos = 0
  for (const lancamento of lancamentos) {
    const descricaoFixa = sanitizeUTF8(lancamento.descricao)
    const categoriaFixa = sanitizeUTF8(lancamento.categoria || '')
    const observacoesFixas = sanitizeUTF8(lancamento.observacoes || '')
    
    const mudou =
      descricaoFixa !== lancamento.descricao ||
      categoriaFixa !== lancamento.categoria ||
      observacoesFixas !== lancamento.observacoes
    
    if (mudou) {
      await prisma.lancamento.update({
        where: { id: lancamento.id },
        data: {
          descricao: descricaoFixa,
          categoria: categoriaFixa || null,
          observacoes: observacoesFixas || null,
        },
      })
      corrigidos++
    }
  }
  
  console.log(`✅ Corrigidos ${corrigidos}/${lancamentos.length} lançamentos`)
}

async function fixTarefasEncoding() {
  console.log('\n📋 Corrigindo encoding em Tarefas...')
  const tarefas = await prisma.tarefa.findMany()
  
  let corrigidos = 0
  for (const tarefa of tarefas) {
    const tituloFixo = sanitizeUTF8(tarefa.titulo)
    const descricaoFixa = sanitizeUTF8(tarefa.descricao || '')
    
    const mudou =
      tituloFixo !== tarefa.titulo ||
      descricaoFixa !== tarefa.descricao
    
    if (mudou) {
      await prisma.tarefa.update({
        where: { id: tarefa.id },
        data: {
          titulo: tituloFixo,
          descricao: descricaoFixa || null,
        },
      })
      corrigidos++
    }
  }
  
  console.log(`✅ Corrigidos ${corrigidos}/${tarefas.length} tarefas`)
}

async function fixLeadsEncoding() {
  console.log('\n📋 Corrigindo encoding em Leads...')
  const leads = await prisma.lead.findMany()
  
  let corrigidos = 0
  for (const lead of leads) {
    const nomeFixo = sanitizeUTF8(lead.nome)
    const observacoesFixas = sanitizeUTF8(lead.observacoes || '')
    
    const mudou =
      nomeFixo !== lead.nome ||
      observacoesFixas !== lead.observacoes
    
    if (mudou) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          nome: nomeFixo,
          observacoes: observacoesFixas || null,
        },
      })
      corrigidos++
    }
  }
  
  console.log(`✅ Corrigidos ${corrigidos}/${leads.length} leads`)
}

async function main() {
  console.log('🔧 Iniciando correção de encoding UTF-8...')
  console.log('=' .repeat(50))
  
  try {
    await fixClientesEncoding()
    await fixProcessosEncoding()
    await fixLancamentosEncoding()
    await fixTarefasEncoding()
    await fixLeadsEncoding()
    
    console.log('\n' + '='.repeat(50))
    console.log('✨ Correção de encoding concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante correção:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
