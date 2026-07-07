// ============================================================
// PJM - Camada de Dados: Presenças e Histórico
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import type { Presenca, Historico, FiltrosHistorico, StatusPresenca } from '@/types'

/**
 * Registra ou atualiza a presença de um aluno em uma data.
 */
export async function registrarPresenca(dados: {
  aluno_id: string
  data: string
  status: StatusPresenca
  observacao?: string
}): Promise<{ presenca?: Presenca; erro?: string }> {
  const supabase = createAdminClient()

  // Upsert: insere ou atualiza se já existir
  const { data, error } = await supabase
    .from('presencas')
    .upsert(
      {
        aluno_id: dados.aluno_id,
        data: dados.data,
        status: dados.status,
        observacao: dados.observacao || null,
      },
      { onConflict: 'aluno_id,data' }
    )
    .select('*')
    .single()

  if (error || !data) {
    return { erro: 'Erro ao registrar presença.' }
  }

  return { presenca: data as Presenca }
}

/**
 * Registra presença em lote para múltiplos alunos (chamada do dia).
 */
export async function registrarChamada(
  chamadas: Array<{
    aluno_id: string
    data: string
    status: StatusPresenca
    observacao?: string
  }>
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('presencas')
    .upsert(
      chamadas.map((c) => ({
        aluno_id: c.aluno_id,
        data: c.data,
        status: c.status,
        observacao: c.observacao || null,
      })),
      { onConflict: 'aluno_id,data' }
    )

  if (error) return { sucesso: false, erro: 'Erro ao registrar chamada.' }
  return { sucesso: true }
}

/**
 * Busca as presenças de um aluno em uma data específica.
 */
export async function buscarPresencaPorData(
  alunoId: string,
  data: string
): Promise<Presenca | null> {
  const supabase = createAdminClient()
  const { data: presenca, error } = await supabase
    .from('presencas')
    .select('*')
    .eq('aluno_id', alunoId)
    .eq('data', data)
    .single()

  if (error || !presenca) return null
  return presenca as Presenca
}

/**
 * Busca todas as presenças de um grupo em uma data.
 */
export async function buscarPresencasPorGrupoEData(
  grupoId: string,
  data: string
): Promise<Presenca[]> {
  const supabase = createAdminClient()
  const { data: presencas, error } = await supabase
    .from('presencas')
    .select(`*, aluno:alunos!inner(id, nome_completo, grupo_id)`)
    .eq('aluno.grupo_id', grupoId)
    .eq('data', data)

  if (error || !presencas) return []
  return presencas as Presenca[]
}

/**
 * Lista o histórico com filtros opcionais.
 */
export async function listarHistorico(filtros?: FiltrosHistorico): Promise<Historico[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('historico')
    .select(`
      *,
      aluno:alunos(id, nome_completo),
      grupo:grupos(id, nome, cor)
    `)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
    .limit(500)

  if (filtros?.data_inicio) {
    query = query.gte('data', filtros.data_inicio)
  }
  if (filtros?.data_fim) {
    query = query.lte('data', filtros.data_fim)
  }
  if (filtros?.grupo_id) {
    query = query.eq('grupo_id', filtros.grupo_id)
  }
  if (filtros?.aluno_id) {
    query = query.eq('aluno_id', filtros.aluno_id)
  }
  if (filtros?.status) {
    query = query.eq('status', filtros.status)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data as Historico[]
}

/**
 * Calcula o percentual de presença de um aluno.
 */
export async function calcularPresencaAluno(alunoId: string): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('presencas')
    .select('status')
    .eq('aluno_id', alunoId)

  if (!data || data.length === 0) return 100
  const presentes = data.filter((p) => p.status === 'presente').length
  return Math.round((presentes / data.length) * 100)
}

/**
 * Obtém as estatísticas gerais para o dashboard.
 */
export async function obterEstatisticas() {
  const supabase = createAdminClient()

  const [grupos, alunos, presencas] = await Promise.all([
    supabase.from('grupos').select('id', { count: 'exact', head: true }),
    supabase.from('alunos').select('id', { count: 'exact', head: true }),
    supabase.from('presencas').select('status'),
  ])

  const totalPresencas = presencas.data?.length ?? 0
  const totalPresentes = presencas.data?.filter((p) => p.status === 'presente').length ?? 0
  const totalFaltas = presencas.data?.filter((p) => p.status === 'falta').length ?? 0
  const totalFaltasJustificadas =
    presencas.data?.filter((p) => p.status === 'falta_justificada').length ?? 0
  const mediaPresenca =
    totalPresencas === 0 ? 100 : Math.round((totalPresentes / totalPresencas) * 100)

  return {
    total_grupos: grupos.count ?? 0,
    total_alunos: alunos.count ?? 0,
    media_presenca: mediaPresenca,
    total_faltas: totalFaltas,
    total_faltas_justificadas: totalFaltasJustificadas,
    total_presentes: totalPresentes,
  }
}

/**
 * Obtém dados de presença por mês para gráficos.
 */
export async function obterPresencaPorMes() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('presencas')
    .select('data, status')
    .order('data')

  if (!data) return []

  // Agrupa por mês
  const porMes: Record<string, { presentes: number; faltas: number; justificadas: number }> = {}

  data.forEach((p) => {
    const mes = p.data.substring(0, 7) // YYYY-MM
    if (!porMes[mes]) {
      porMes[mes] = { presentes: 0, faltas: 0, justificadas: 0 }
    }
    if (p.status === 'presente') porMes[mes].presentes++
    else if (p.status === 'falta') porMes[mes].faltas++
    else porMes[mes].justificadas++
  })

  return Object.entries(porMes)
    .slice(-6) // Últimos 6 meses
    .map(([mes, valores]) => ({
      mes,
      ...valores,
    }))
}
