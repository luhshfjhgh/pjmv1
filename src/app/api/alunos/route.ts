// ============================================================
// PJM - API Route: Alunos
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { listarAlunos, criarAluno } from '@/lib/db/alunos'
import { z } from 'zod'

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  foto_url: z.string().url().optional().nullable(),
  grupo_id: z.string().uuid('Grupo inválido'),
  telefone: z.string().min(8, 'Telefone inválido'),
})

/** GET /api/alunos?grupo_id=... */
export async function GET(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const grupoId = searchParams.get('grupo_id') || undefined

  const alunos = await listarAlunos(grupoId)
  return NextResponse.json({ alunos })
}

/** POST /api/alunos */
export async function POST(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const resultado = alunoSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const dados = {
    ...resultado.data,
    foto_url: resultado.data.foto_url ?? undefined,
  }

  const { aluno, erro } = await criarAluno(dados)
  if (erro) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ aluno }, { status: 201 })
}