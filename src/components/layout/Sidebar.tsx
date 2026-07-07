'use client'

// ============================================================
// PJM - Componente Sidebar
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UserCheck,
  ClipboardList,
  History,
  Upload,
  Download,
  Database,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { SessaoPayload } from '@/types'

interface SidebarProps {
  sessao: SessaoPayload
}

// Itens de navegação
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/grupos', label: 'Grupos', icon: Users },
  { href: '/alunos', label: 'Alunos', icon: UserCheck },
  { href: '/chamada', label: 'Chamada', icon: ClipboardList },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/importacao', label: 'Importação', icon: Upload },
  { href: '/exportacao', label: 'Exportação', icon: Download },
  { href: '/backup', label: 'Backup', icon: Database },
]

const adminItems = [
  { href: '/admin', label: 'Administrador', icon: Shield },
]

export function Sidebar({ sessao }: SidebarProps) {
  const pathname = usePathname()
  const [recolhida, setRecolhida] = useState(false)
  const [abertaMobile, setAbertaMobile] = useState(false)

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
    const ativo = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        onClick={() => setAbertaMobile(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
          ativo
            ? 'bg-violet-600 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900 indicator-left'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:scale-[1.02]'
        )}
      >
        <Icon className={cn('flex-shrink-0', recolhida ? 'w-5 h-5' : 'w-4 h-4')} />
        {!recolhida && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800',
        recolhida && 'justify-center'
      )}>
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <Image src="/logo.png" alt="PJM Logo" width={40} height={40} className="object-contain" priority />
        </div>
        {!recolhida && (
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">PJM</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">Presença</p>
          </div>
        )}
      </div>

      {/* Navegação principal */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Separador e itens admin */}
        {sessao.role === 'admin' && (
          <>
            <div className="my-2 border-t border-gray-200 dark:border-gray-800" />
            {adminItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      {/* Usuário logado */}
      {!recolhida && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {sessao.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {sessao.nome}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {sessao.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botão recolher (desktop) */}
      <button
        onClick={() => setRecolhida(!recolhida)}
        className="hidden md:flex items-center justify-center p-2 m-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        {recolhida ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setAbertaMobile(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Overlay mobile */}
      {abertaMobile && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setAbertaMobile(false)}
        />
      )}

      {/* Sidebar mobile */}
      <aside
        className={cn(
          'md:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300',
          abertaMobile ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setAbertaMobile(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
          recolhida ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
