import { z } from 'zod'

export const clienteSchema = z.object({
  tipo: z.enum(['PESSOA_FISICA', 'PESSOA_JURIDICA']),
  nomeCompleto: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  razaoSocial: z.string().optional(),
  cnpj: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'E-mail inválido',
    }),
  telefone: z.string().optional(),
  whatsapp: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  areaJuridica: z.string().optional(),
  origemCliente: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'PROSPECTO', 'DOCUMENTACAO_PENDENTE']),
})

export type ClienteFormData = z.infer<typeof clienteSchema>

export const processoSchema = z.object({
  clienteId: z.string().min(1, 'Selecione um cliente'),
  responsavelId: z.string().optional(),
  tipo: z.enum(['JUDICIAL', 'ADMINISTRATIVO']),
  fase: z.enum(['CONHECIMENTO', 'RECURSAL', 'EXECUCAO', 'ENCERRADO']),
  status: z.enum([
    'EM_ANDAMENTO',
    'AGUARDANDO_PECA',
    'AGUARDANDO_CLIENTE',
    'SUSPENSO',
    'ENCERRADO_PROCEDENTE',
    'ENCERRADO_IMPROCEDENTE',
    'ARQUIVADO',
  ]),
  numero: z.string().optional(),
  tribunal: z.string().optional(),
  vara: z.string().optional(),
  comarca: z.string().optional(),
  tipoAcao: z.string().optional(),
  areaJuridica: z.string().optional(),
  dataDistribuicao: z.string().optional(),
  valorCausa: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: 'Valor da causa deve ser um número positivo',
    }),
  observacoes: z.string().optional(),
})

export type ProcessoFormData = z.infer<typeof processoSchema>

export const tarefaSchema = z.object({
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  status: z.enum(['A_FAZER', 'EM_ANDAMENTO', 'AGUARDANDO_REVISAO', 'CONCLUIDO', 'CANCELADO']),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']),
  dataVencimento: z.string().optional(),
  responsavelId: z.string().optional(),
  processoId: z.string().optional(),
})

export type TarefaFormData = z.infer<typeof tarefaSchema>
