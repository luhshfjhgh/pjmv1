// ============================================================
// PJM - Página Raiz (redireciona automaticamente)
// ============================================================
import { redirect } from 'next/navigation'
import { obterSessao } from '@/lib/auth'

export default async function Home() {
  const sessao = await obterSessao()

  // Se autenticado, vai para o dashboard; caso contrário, para o login
  if (sessao) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
