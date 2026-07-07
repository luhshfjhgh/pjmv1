// ============================================================
// PJM - Layout do Dashboard (com Sidebar)
// ============================================================
import { obterSessao } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verifica autenticação no servidor
  const sessao = await obterSessao()
  if (!sessao) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar de navegação */}
      <Sidebar sessao={sessao} />

      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior */}
        <Header sessao={sessao} />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
