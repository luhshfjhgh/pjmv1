// ============================================================
// PJM - API Route: Histórico
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { listarHistorico, obterEstatisticas, obterPresencaPorMes } from '@/lib/db/presencas'

/** GET /api/historico - Lista histórico com filtros */
export async function GET(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  const filtros = {
    data_inicio: searchParams.get('data_inicio') || undefined,
    data_fim: searchParams.get('data_fim') || undefined,
    grupo_id: searchParams.get('grupo_id') || undefined,
    aluno_id: searchParams.get('aluno_id') || undefined,
    status: (searchParams.get('status') as any) || undefined,
  }

  const historico = await listarHistorico(filtros)
  return NextResponse.json({ historico })
}
