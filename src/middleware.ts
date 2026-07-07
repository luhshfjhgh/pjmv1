// ============================================================
// PJM - Middleware de Proteção de Rotas
// ============================================================
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pjm_segredo_padrao_troque_em_producao_32chars'
)

// Rotas públicas (não requerem autenticação)
const ROTAS_PUBLICAS = ['/login']

// Rotas exclusivas para administradores
const ROTAS_ADMIN = ['/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verifica se é rota pública
  const ehRotaPublica = ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))

  // Obtém o token do cookie
  const token = request.cookies.get('pjm_sessao')?.value

  // Se não há token e não é rota pública, redireciona para login
  if (!token && !ehRotaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se há token, verifica validade
  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Se está na página de login e já autenticado, redireciona para dashboard
      if (ehRotaPublica) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // Verifica permissão para rotas admin
      const ehRotaAdmin = ROTAS_ADMIN.some((rota) => pathname.startsWith(rota))
      if (ehRotaAdmin && payload.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    } catch {
      // Token inválido ou expirado
      if (!ehRotaPublica) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const response = NextResponse.redirect(url)
        response.cookies.delete('pjm_sessao')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  // Aplica o middleware em todas as rotas exceto arquivos estáticos e API
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
