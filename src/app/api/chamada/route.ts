// ============================================================
// PJM - API Route: Chamada
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { registrarChamada, buscarPresencasPorGrupoEData } from '@/lib/db/presencas'
import { z } from 'zod'

const chamadaSchema = z.object({
  chamadas: z.array(
    z.object({
      aluno_id: z.string().uuid(),
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      status: z.enum(['presente', 'falta', 'falta_justificada']),
      observacao: z.string().optional(),
    })
  ).min(1, 'Nenhuma chamada fornecida'),
})

/** POST /api/chamada - Registra chamada em lote */
export async function POST(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const resultado = chamadaSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { sucesso, erro } = await registrarChamada(resultado.data.chamadas)
  if (!sucesso) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ mensagem: 'Chamada registrada com sucesso.' })
}

/** GET /api/chamada?grupo_id=...&data=... - Busca chamada de um grupo em uma data */
export async function GET(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const grupoId = searchParams.get('grupo_id')
  const data = searchParams.get('data')

  if (!grupoId || !data) {
    return NextResponse.json({ erro: 'grupo_id e data são obrigatórios.' }, { status: 400 })
  }

  const presencas = await buscarPresencasPorGrupoEData(grupoId, data)
  return NextResponse.json({ presencas })
}
