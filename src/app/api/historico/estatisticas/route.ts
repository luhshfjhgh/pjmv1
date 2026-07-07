// ============================================================
// PJM - API Route: Estatísticas do Dashboard
// ============================================================
import { NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { obterEstatisticas, obterPresencaPorMes } from '@/lib/db/presencas'

/** GET /api/historico/estatisticas */
export async function GET() {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const [estatisticas, presencaPorMes] = await Promise.all([
    obterEstatisticas(),
    obterPresencaPorMes(),
  ])

  return NextResponse.json({ estatisticas, presencaPorMes })
}
