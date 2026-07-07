// ============================================================
// PJM - API Route: Grupos
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { listarGrupos, criarGrupo } from '@/lib/db/grupos'
import { z } from 'zod'

const grupoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
})

/** GET /api/grupos - Lista todos os grupos */
export async function GET() {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const grupos = await listarGrupos()
  return NextResponse.json({ grupos })
}

/** POST /api/grupos - Cria um novo grupo */
export async function POST(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const resultado = grupoSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { grupo, erro } = await criarGrupo(resultado.data)
  if (erro) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ grupo }, { status: 201 })
}
