// ============================================================
// PJM - API Route: Grupo por ID (GET, PUT, DELETE)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { buscarGrupoPorId, atualizarGrupo, excluirGrupo } from '@/lib/db/grupos'
import { z } from 'zod'

const grupoSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

/** GET /api/grupos/[id] */
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const grupo = await buscarGrupoPorId(params.id)
  if (!grupo) return NextResponse.json({ erro: 'Grupo não encontrado.' }, { status: 404 })

  return NextResponse.json({ grupo })
}

/** PUT /api/grupos/[id] */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const resultado = grupoSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { grupo, erro } = await atualizarGrupo(params.id, resultado.data)
  if (erro) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ grupo })
}

/** DELETE /api/grupos/[id] */
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { sucesso, erro } = await excluirGrupo(params.id)
  if (!sucesso) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ mensagem: 'Grupo excluído com sucesso.' })
}
