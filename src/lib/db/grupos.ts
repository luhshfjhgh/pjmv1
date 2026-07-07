// ============================================================
// PJM - Camada de Dados: Grupos
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import type { Grupo } from '@/types'

/**
 * Lista todos os grupos com contagem de alunos.
 */
export async function listarGrupos(): Promise<Grupo[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      total_alunos:alunos(count)
    `)
    .order('nome')

  if (error || !data) return []

  return data.map((g: any) => ({
    ...g,
    total_alunos: g.total_alunos?.[0]?.count ?? 0,
  })) as Grupo[]
}

/**
 * Busca um grupo pelo ID.
 */
export async function buscarGrupoPorId(id: string): Promise<Grupo | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Grupo
}

/**
 * Cria um novo grupo.
 */
export async function criarGrupo(dados: {
  nome: string
  descricao?: string
  cor: string
}): Promise<{ grupo?: Grupo; erro?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('grupos')
    .insert({
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim() || null,
      cor: dados.cor,
    })
    .select('*')
    .single()

  if (error || !data) {
    return { erro: 'Erro ao criar grupo.' }
  }

  return { grupo: data as Grupo }
}

/**
 * Atualiza um grupo existente.
 */
export async function atualizarGrupo(
  id: string,
  dados: Partial<{ nome: string; descricao: string; cor: string }>
): Promise<{ grupo?: Grupo; erro?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('grupos')
    .update({
      ...dados,
      nome: dados.nome?.trim(),
      descricao: dados.descricao?.trim() || null,
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return { erro: 'Erro ao atualizar grupo.' }
  }

  return { grupo: data as Grupo }
}

/**
 * Exclui um grupo (somente se não tiver alunos vinculados).
 */
export async function excluirGrupo(id: string): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createAdminClient()

  // Verifica se há alunos no grupo
  const { count } = await supabase
    .from('alunos')
    .select('id', { count: 'exact', head: true })
    .eq('grupo_id', id)

  if (count && count > 0) {
    return {
      sucesso: false,
      erro: `Não é possível excluir: este grupo possui ${count} aluno(s) vinculado(s).`,
    }
  }

  const { error } = await supabase.from('grupos').delete().eq('id', id)

  if (error) return { sucesso: false, erro: 'Erro ao excluir grupo.' }
  return { sucesso: true }
}
