// ============================================================
// Supabase - Cliente para uso no browser (componentes client)
// ============================================================
import { createBrowserClient } from '@supabase/ssr'

/**
 * Cria e retorna um cliente Supabase para uso em componentes React client-side.
 * Utiliza as variáveis de ambiente públicas (NEXT_PUBLIC_*).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
