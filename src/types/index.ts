// ============================================================
// PJM - Tipos TypeScript Globais
// ============================================================

/** Usuário do sistema */
export interface Usuario {
  id: string
  nome: string
  email: string
  senha_hash?: string
  role: 'admin' | 'usuario'
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

/** Grupo de alunos */
export interface Grupo {
  id: string
  nome: string
  descricao: string | null
  cor: string
  criado_em: string
  atualizado_em: string
  total_alunos?: number
}

/** Aluno */
export interface Aluno {
  id: string
  nome_completo: string
  foto_url: string | null
  grupo_id: string
  telefone: string
  criado_em: string
  atualizado_em: string
  grupo?: Grupo
  percentual_presenca?: number
}

/** Status de presença */
export type StatusPresenca = 'presente' | 'falta' | 'falta_justificada'

/** Registro de presença */
export interface Presenca {
  id: string
  aluno_id: string
  data: string
  status: StatusPresenca
  observacao: string | null
  criado_em: string
  aluno?: Aluno
}

/** Entrada do histórico */
export interface Historico {
  id: string
  aluno_id: string
  grupo_id: string
  data: string
  status: StatusPresenca
  observacao: string | null
  criado_em: string
  aluno?: Aluno
  grupo?: Grupo
}

/** Backup do sistema */
export interface Backup {
  id: string
  nome: string
  tamanho: number
  criado_por: string
  criado_em: string
  dados?: object
}

/** Estatísticas do dashboard */
export interface EstatisticasDashboard {
  total_grupos: number
  total_alunos: number
  media_presenca: number
  total_faltas: number
  total_faltas_justificadas: number
  total_presentes: number
}

/** Dados de chamada por aluno */
export interface DadosChamada {
  aluno: Aluno
  status: StatusPresenca | null
  observacao: string
}

/** Filtros do histórico */
export interface FiltrosHistorico {
  data_inicio?: string
  data_fim?: string
  grupo_id?: string
  aluno_id?: string
  status?: StatusPresenca
}

/** Resultado de importação */
export interface ResultadoImportacao {
  sucesso: number
  erros: number
  mensagens: string[]
}

/** Payload de sessão JWT */
export interface SessaoPayload {
  id: string
  nome: string
  email: string
  role: 'admin' | 'usuario'
}
