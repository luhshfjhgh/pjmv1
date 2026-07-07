// ============================================================
// PJM - API Route: Usuário por ID (PUT, DELETE)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { atualizarUsuario, excluirUsuario, alterarSenha } from '@/lib/db/usuarios'
import { z } from 'zod'

const updateSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'usuario']).optional(),
  ativo: z.boolean().optional(),
  nova_senha: z.string().min(8).optional(),
})

/** PUT /api/admin/[id] - Atualiza usuário */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  const body = await request.json()
  const resultado = updateSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { nova_senha, ...dadosUpdate } = resultado.data

  // Atualiza dados básicos
  if (Object.keys(dadosUpdate).length > 0) {
    const { erro } = await atualizarUsuario(params.id, dadosUpdate)
    if (erro) return NextResponse.json({ erro }, { status: 400 })
  }

  // Altera senha se fornecida
  if (nova_senha) {
    const { erro } = await alterarSenha(params.id, nova_senha)
    if (erro) return NextResponse.json({ erro }, { status: 400 })
  }

  return NextResponse.json({ mensagem: 'Usuário atualizado com sucesso.' })
}

/** DELETE /api/admin/[id] - Desativa usuário */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  // Impede que o admin exclua a si mesmo
  if (params.id === sessao.id) {
    return NextResponse.json({ erro: 'Você não pode excluir sua própria conta.' }, { status: 400 })
  }

  const { sucesso, erro } = await excluirUsuario(params.id)
  if (!sucesso) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ mensagem: 'Usuário excluído com sucesso.' })
}
