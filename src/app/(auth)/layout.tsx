// ============================================================
// PJM - Layout da Área de Autenticação
// ============================================================
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-violet-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Padrão de fundo sutil com blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl dark:bg-violet-900/20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl dark:bg-indigo-900/20" />
      </div>
      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
