// ============================================================
// PJM - API Route: Exportação de Dados
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/exportacao?tipo=alunos|grupos|historico|completo
 * Exporta dados em formato JSON, ordenados alfabeticamente.
 */
export async function GET(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get('tipo') || 'completo'

  const supabase = createAdminClient()

  try {
    let dados: any = {}

    if (tipo === 'grupos' || tipo === 'completo') {
      const { data } = await supabase
        .from('grupos')
        .select('id, nome, descricao, cor, criado_em')
        .order('nome')
      dados.grupos = data || []
    }

    if (tipo === 'alunos' || tipo === 'completo') {
      const { data } = await supabase
        .from('alunos')
        .select('id, nome_completo, telefone, foto_url, criado_em, grupo:grupos(nome)')
        .order('nome_completo')
      // Formata para exportação
      dados.alunos = (data || []).map((a: any) => ({
        id: a.id,
        nome_completo: a.nome_completo,
        telefone: a.telefone,
        foto_url: a.foto_url,
        grupo_nome: a.grupo?.nome || '',
        criado_em: a.criado_em,
      }))
    }

    if (tipo === 'historico' || tipo === 'completo') {
      const { data } = await supabase
        .from('historico')
        .select(`
          id, data, status, observacao, criado_em,
          aluno:alunos(nome_completo),
          grupo:grupos(nome)
        `)
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false })
      dados.historico = (data || []).map((h: any) => ({
        id: h.id,
        data: h.data,
        status: h.status,
        observacao: h.observacao,
        aluno_nome: h.aluno?.nome_completo || '',
        grupo_nome: h.grupo?.nome || '',
        criado_em: h.criado_em,
      }))
    }

    return NextResponse.json(dados)
  } catch (error) {
    console.error('Erro na exportação:', error)
    return NextResponse.json({ erro: 'Erro ao exportar dados.' }, { status: 500 })
  }
}
