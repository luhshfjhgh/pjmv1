// ============================================================
// PJM - API Route: Aluno por ID
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { buscarAlunoPorId, atualizarAluno, excluirAluno } from '@/lib/db/alunos'
import { z } from 'zod'

const alunoUpdateSchema = z.object({
  nome_completo: z.string().min(3).optional(),
  foto_url: z.string().url().optional().nullable(),
  grupo_id: z.string().uuid().optional(),
  telefone: z.string().min(8).optional(),
})

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const aluno = await buscarAlunoPorId(params.id)
  if (!aluno) return NextResponse.json({ erro: 'Aluno não encontrado.' }, { status: 404 })

  return NextResponse.json({ aluno })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const resultado = alunoUpdateSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { aluno, erro } = await atualizarAluno(params.id, resultado.data)
  if (erro) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ aluno })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  const { sucesso, erro } = await excluirAluno(params.id)
  if (!sucesso) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ mensagem: 'Aluno excluído com sucesso.' })
}
