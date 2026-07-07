'use client'

// ============================================================
// PJM - Página de Login
// ============================================================
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Schema de validação do formulário de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (dados: LoginForm) => {
    setCarregando(true)
    try {
      const resposta = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const json = await resposta.json()

      if (!resposta.ok) {
        toast.error(json.erro || 'Erro ao fazer login.')
        return
      }

      toast.success(`Bem-vindo, ${json.usuario.nome}!`)
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      {/* Logo e título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-4">
          <Image src="/logo.png" alt="PJM Logo" width={96} height={96} className="object-contain" priority />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PJM</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Presença Jovem Missionário</p>
      </div>

      {/* Card de login */}
      <Card className="shadow-xl border border-white/20 dark:border-white/10 glass-effect backdrop-blur-lg bg-white/95 dark:bg-gray-900/80">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center">
            Acesse sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={carregando}
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={carregando}
                  {...register('senha')}
                  className={errors.senha ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && (
                <p className="text-sm text-red-500">{errors.senha.message}</p>
              )}
            </div>

            {/* Botão de login */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold"
              disabled={carregando}
            >
              {carregando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </span>
              )}
            </Button>
          </form>

          {/* Credenciais padrão */}
          <div className="mt-4 p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
            <p className="text-xs text-violet-700 dark:text-violet-300 text-center font-medium">
              Acesso padrão: admin@pjm.com / Admin@123
            </p>
            <p className="text-xs text-violet-500 dark:text-violet-400 text-center mt-0.5">
              Altere a senha após o primeiro acesso
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-gray-400 mt-6">
        © {new Date().getFullYear()} PJM - Presença Jovem Missionário
      </p>
    </div>
  )
}
