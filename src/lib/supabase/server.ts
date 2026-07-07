// ============================================================
// Supabase - Cliente para uso no servidor (Server Components / API Routes)
// ============================================================
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `[PJM] Variável de ambiente obrigatória ausente: ${name}\n` +
      `Verifique se o arquivo .env.local contém: ${name}=<valor>\n` +
      `e reinicie o servidor com npm run dev.`
    )
  }
  return value
}

/**
 * Cria e retorna um cliente Supabase para uso em Server Components e API Routes.
 * Lê e escreve cookies para manter a sessão do usuário.
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignorado em Server Components read-only
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignorado em Server Components read-only
          }
        },
      },
    }
  )
}

/**
 * Cria um cliente Supabase com a service role key para operações administrativas.
 * NUNCA use este cliente no frontend.
 */
export function createAdminClient() {
  return createSupabaseClient(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
