'use client'

// ============================================================
// PJM - Componente Header
// ============================================================
import { useRouter } from 'next/navigation'
import { LogOut, Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { SessaoPayload } from '@/types'

interface HeaderProps {
  sessao: SessaoPayload
}

export function Header({ sessao }: HeaderProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      toast.success('Até logo!')
      router.push('/login')
      router.refresh()
    } catch {
      toast.error('Erro ao sair.')
    }
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      {/* Espaço para o botão mobile da sidebar */}
      <div className="w-10 md:w-0" />

      {/* Título da aplicação (centro no mobile) */}
      <div className="flex-1 text-center md:text-left">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 md:hidden">
          PJM
        </span>
      </div>

      {/* Ações do header */}
      <div className="flex items-center gap-2">
        {/* Alternador de tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-gray-500 dark:text-gray-400"
          title="Alternar tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Alternar tema</span>
        </Button>

        {/* Saudação (desktop) */}
        <span className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
          Olá, <strong className="text-gray-900 dark:text-white">{sessao.nome.split(' ')[0]}</strong>
        </span>

        {/* Botão de logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sair</span>
        </Button>
      </div>
    </header>
  )
}
