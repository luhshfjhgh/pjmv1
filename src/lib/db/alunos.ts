// ============================================================
// PJM - Camada de Dados: Alunos
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import type { Aluno } from '@/types'

/**
 * Lista todos os alunos com grupo e percentual de presença.
 */
export async function listarAlunos(grupoId?: string): Promise<Aluno[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('alunos')
    .select(`
      *,
      grupo:grupos(id, nome, cor)
    `)
    .order('nome_completo')

  if (grupoId) {
    query = query.eq('grupo_id', grupoId)
  }

  const { data, error } = await query
  if (error || !data) return []

  // Calcula percentual de presença para cada aluno
  const alunosComPresenca = await Promise.all(
    data.map(async (aluno: any) => {
      const { data: presencas } = await supabase
        .from('presencas')
        .select('status')
        .eq('aluno_id', aluno.id)

      const total = presencas?.length ?? 0
      const presentes = presencas?.filter((p) => p.status === 'presente').length ?? 0
      const percentual = total === 0 ? 100 : Math.round((presentes / total) * 100)

      return { ...aluno, percentual_presenca: percentual }
    })
  )

  return alunosComPresenca as Aluno[]
}

/**
 * Busca um aluno pelo ID.
 */
export async function buscarAlunoPorId(id: string): Promise<Aluno | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('alunos')
    .select(`*, grupo:grupos(id, nome, cor)`)
    .eq('id', id)
    .single()

  if (error || !data) return null

  // Calcula percentual de presença
  const { data: presencas } = await supabase
    .from('presencas')
    .select('status')
    .eq('aluno_id', id)

  const total = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.status === 'presente').length ?? 0
  const percentual = total === 0 ? 100 : Math.round((presentes / total) * 100)

  return { ...data, percentual_presenca: percentual } as Aluno
}

/**
 * Cria um novo aluno.
 */
export async function criarAluno(dados: {
  nome_completo: string
  foto_url?: string
  grupo_id: string
  telefone: string
}): Promise<{ aluno?: Aluno; erro?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('alunos')
    .insert({
      nome_completo: dados.nome_completo.trim(),
      foto_url: dados.foto_url || null,
      grupo_id: dados.grupo_id,
      telefone: dados.telefone.trim(),
    })
    .select(`*, grupo:grupos(id, nome, cor)`)
    .single()

  if (error || !data) {
    return { erro: 'Erro ao criar aluno.' }
  }

  return { aluno: { ...data, percentual_presenca: 100 } as Aluno }
}

/**
 * Atualiza um aluno existente.
 */
export async function atualizarAluno(
  id: string,
  dados: Partial<{
    nome_completo: string
    foto_url: string | null
    grupo_id: string
    telefone: string
  }>
): Promise<{ aluno?: Aluno; erro?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('alunos')
    .update({
      ...dados,
      nome_completo: dados.nome_completo?.trim(),
      telefone: dados.telefone?.trim(),
    })
    .eq('id', id)
    .select(`*, grupo:grupos(id, nome, cor)`)
    .single()

  if (error || !data) {
    return { erro: 'Erro ao atualizar aluno.' }
  }

  return { aluno: data as Aluno }
}

/**
 * Exclui um aluno e todas as suas presenças.
 */
export async function excluirAluno(id: string): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('alunos').delete().eq('id', id)

  if (error) return { sucesso: false, erro: 'Erro ao excluir aluno.' }
  return { sucesso: true }
}
