// ============================================================
// PJM - API Route: Autenticação (Login / Logout)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { verificarCredenciais } from '@/lib/db/usuarios'
import { criarToken, definirCookieSessao, removerCookieSessao } from '@/lib/auth'
import { z } from 'zod'

// Schema de validação do login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

/**
 * POST /api/auth - Realiza o login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Valida os dados de entrada
    const resultado = loginSchema.safeParse(body)
    if (!resultado.success) {
      return NextResponse.json(
        { erro: resultado.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, senha } = resultado.data

    // Verifica as credenciais
    const { usuario, erro } = await verificarCredenciais(email, senha)

    if (erro || !usuario) {
      return NextResponse.json(
        { erro: erro || 'Credenciais inválidas.' },
        { status: 401 }
      )
    }

    // Cria o token JWT
    const token = await criarToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    })

    // Define o cookie de sessão
    definirCookieSessao(token)

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { erro: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/auth - Realiza o logout
 */
export async function DELETE() {
  removerCookieSessao()
  return NextResponse.json({ mensagem: 'Logout realizado com sucesso.' })
}
