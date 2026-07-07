// ============================================================
// PJM - API Route: Administração de Usuários
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { listarUsuarios, criarUsuario } from '@/lib/db/usuarios'
import { z } from 'zod'

const criarUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['admin', 'usuario']),
})

/** GET /api/admin - Lista todos os usuários */
export async function GET() {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  const usuarios = await listarUsuarios()
  return NextResponse.json({ usuarios })
}

/** POST /api/admin - Cria um novo usuário */
export async function POST(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao || sessao.role !== 'admin') {
    return NextResponse.json({ erro: 'Acesso negado.' }, { status: 403 })
  }

  const body = await request.json()
  const resultado = criarUsuarioSchema.safeParse(body)
  if (!resultado.success) {
    return NextResponse.json({ erro: resultado.error.errors[0].message }, { status: 400 })
  }

  const { usuario, erro } = await criarUsuario(resultado.data)
  if (erro) return NextResponse.json({ erro }, { status: 400 })

  return NextResponse.json({ usuario }, { status: 201 })
}
