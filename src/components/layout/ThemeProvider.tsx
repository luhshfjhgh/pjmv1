'use client'

// ============================================================
// PJM - Provedor de Tema (next-themes)
// ============================================================
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

/**
 * Envolve a aplicação com o provedor de tema do next-themes.
 * Permite alternar entre tema claro, escuro e sistema.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
