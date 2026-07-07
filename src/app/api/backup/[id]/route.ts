// ============================================================
// PJM - API Route: Backup por ID (download e restauração)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/backup/[id] - Obtém dados de um backup para download
 */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('backups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ erro: 'Backup não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ backup: data })
}

/**
 * POST /api/backup/[id]/restaurar - Restaura um backup
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado. Apenas administradores.' }, { status: 403 })
  }

  const supabase = createAdminClient()

  // Busca o backup
  const { data: backup, error } = await supabase
    .from('backups')
    .select('dados')
    .eq('id', params.id)
    .single()

  if (error || !backup) {
    return NextResponse.json({ erro: 'Backup não encontrado.' }, { status: 404 })
  }

  try {
    const dados = backup.dados as any

    // Restaura grupos
    if (dados.grupos?.length > 0) {
      await supabase.from('grupos').upsert(dados.grupos, { onConflict: 'id' })
    }

    // Restaura alunos
    if (dados.alunos?.length > 0) {
      await supabase.from('alunos').upsert(dados.alunos, { onConflict: 'id' })
    }

    // Restaura presenças
    if (dados.presencas?.length > 0) {
      await supabase.from('presencas').upsert(dados.presencas, { onConflict: 'id' })
    }

    return NextResponse.json({ mensagem: 'Backup restaurado com sucesso.' })
  } catch (err) {
    console.error('Erro ao restaurar backup:', err)
    return NextResponse.json({ erro: 'Erro ao restaurar backup.' }, { status: 500 })
  }
}

/**
 * DELETE /api/backup/[id] - Exclui um backup
 */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('backups').delete().eq('id', params.id)

  if (error) return NextResponse.json({ erro: 'Erro ao excluir backup.' }, { status: 500 })
  return NextResponse.json({ mensagem: 'Backup excluído.' })
}
