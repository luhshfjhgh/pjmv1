// ============================================================
// PJM - API Route: Backup
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/backup - Lista todos os backups
 */
export async function GET() {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('backups')
    .select('id, nome, tamanho, criado_por, criado_em')
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ erro: 'Erro ao listar backups.' }, { status: 500 })
  return NextResponse.json({ backups: data || [] })
}

/**
 * POST /api/backup - Cria um novo backup manual
 */
export async function POST() {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const supabase = createAdminClient()

  try {
    // Coleta todos os dados do banco
    const [grupos, alunos, presencas, historico, usuarios] = await Promise.all([
      supabase.from('grupos').select('*').order('nome'),
      supabase.from('alunos').select('*').order('nome_completo'),
      supabase.from('presencas').select('*').order('data'),
      supabase.from('historico').select('*').order('data', { ascending: false }),
      supabase.from('usuarios').select('id, nome, email, role, ativo, criado_em').order('nome'),
    ])

    const dados = {
      versao: '1.0',
      criado_em: new Date().toISOString(),
      grupos: grupos.data || [],
      alunos: alunos.data || [],
      presencas: presencas.data || [],
      historico: historico.data || [],
      usuarios: usuarios.data || [],
    }

    const dadosJSON = JSON.stringify(dados)
    const tamanho = new TextEncoder().encode(dadosJSON).length
    const nome = `backup_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`

    const { data, error } = await supabase
      .from('backups')
      .insert({
        nome,
        tamanho,
        dados,
        criado_por: sessao.id,
      })
      .select('id, nome, tamanho, criado_em')
      .single()

    if (error) {
      return NextResponse.json({ erro: 'Erro ao criar backup.' }, { status: 500 })
    }

    return NextResponse.json({ backup: data, dados }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar backup:', error)
    return NextResponse.json({ erro: 'Erro interno ao criar backup.' }, { status: 500 })
  }
}
