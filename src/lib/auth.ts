// ============================================================
// PJM - Utilitários de Autenticação
// ============================================================
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { SessaoPayload } from '@/types'

const COOKIE_NAME = 'pjm_sessao'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pjm_segredo_padrao_troque_em_producao_32chars'
)

/**
 * Cria um token JWT assinado com os dados da sessão do usuário.
 */
export async function criarToken(payload: SessaoPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token válido por 7 dias
    .sign(JWT_SECRET)
}

/**
 * Verifica e decodifica um token JWT.
 * Retorna o payload ou null se inválido/expirado.
 */
export async function verificarToken(token: string): Promise<SessaoPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessaoPayload
  } catch {
    return null
  }
}

/**
 * Obtém a sessão atual a partir do cookie.
 * Retorna o payload da sessão ou null se não autenticado.
 */
export async function obterSessao(): Promise<SessaoPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verificarToken(token)
}

/**
 * Define o cookie de sessão com o token JWT.
 */
export function definirCookieSessao(token: string) {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,       // Não acessível via JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS em produção
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias em segundos
    path: '/',
  })
}

/**
 * Remove o cookie de sessão (logout).
 */
export function removerCookieSessao() {
  const cookieStore = cookies()
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export { COOKIE_NAME }
