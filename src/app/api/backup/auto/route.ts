// ============================================================
// PJM - API Route: Backup Automático (Cron Job)
// ============================================================
// Esta rota é chamada pelo Vercel Cron Jobs diariamente.
// Configure em vercel.json:
// {
//   "crons": [{ "path": "/api/backup/auto", "schedule": "0 3 * * *" }]
// }
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/backup/auto - Cria backup automático (chamado pelo cron)
 * Protegido pelo header CRON_SECRET da Vercel.
 */
export async function GET(request: NextRequest) {
  // Verifica se a requisição vem do cron da Vercel
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    // Coleta todos os dados
    const [grupos, alunos, presencas, historico] = await Promise.all([
      supabase.from('grupos').select('*').order('nome'),
      supabase.from('alunos').select('*').order('nome_completo'),
      supabase.from('presencas').select('*').order('data'),
      supabase.from('historico').select('*').order('data', { ascending: false }),
    ])

    const dados = {
      versao: '1.0',
      tipo: 'automatico',
      criado_em: new Date().toISOString(),
      grupos: grupos.data || [],
      alunos: alunos.data || [],
      presencas: presencas.data || [],
      historico: historico.data || [],
    }

    const dadosJSON = JSON.stringify(dados)
    const tamanho = new TextEncoder().encode(dadosJSON).length
    const nome = `backup_auto_${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}`

    const { error } = await supabase.from('backups').insert({
      nome,
      tamanho,
      dados,
    })

    if (error) {
      console.error('Erro no backup automático:', error)
      return NextResponse.json({ erro: 'Erro ao criar backup automático.' }, { status: 500 })
    }

    // Remove backups automáticos com mais de 30 dias
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
    await supabase
      .from('backups')
      .delete()
      .like('nome', 'backup_auto_%')
      .lt('criado_em', trintaDiasAtras.toISOString())

    console.log(`Backup automático criado: ${nome}`)
    return NextResponse.json({ mensagem: 'Backup automático criado com sucesso.', nome })
  } catch (error) {
    console.error('Erro no backup automático:', error)
    return NextResponse.json({ erro: 'Erro interno.' }, { status: 500 })
  }
}
