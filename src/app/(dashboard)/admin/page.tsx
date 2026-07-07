'use client'

// ============================================================
// PJM - Página do Painel Administrador
// ============================================================
import { useEffect, useState } from 'react'
import { Shield, Plus, Pencil, Trash2, Key, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatarData } from '@/lib/utils'
import type { Usuario } from '@/types'

const criarUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum(['admin', 'usuario']),
})

const alterarSenhaSchema = z.object({
  nova_senha: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  confirmar_senha: z.string(),
}).refine((d) => d.nova_senha === d.confirmar_senha, {
  message: 'As senhas não conferem',
  path: ['confirmar_senha'],
})

type CriarUsuarioForm = z.infer<typeof criarUsuarioSchema>
type AlterarSenhaForm = z.infer<typeof alterarSenhaSchema>

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)
  const [dialogCriar, setDialogCriar] = useState(false)
  const [dialogSenha, setDialogSenha] = useState<Usuario | null>(null)
  const [usuarioExcluindo, setUsuarioExcluindo] = useState<Usuario | null>(null)
  const [salvando, setSalvando] = useState(false)

  const formCriar = useForm<CriarUsuarioForm>({
    resolver: zodResolver(criarUsuarioSchema),
    defaultValues: { role: 'usuario' },
  })

  const formSenha = useForm<AlterarSenhaForm>({
    resolver: zodResolver(alterarSenhaSchema),
  })

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/admin')
      const json = await res.json()
      if (res.ok) setUsuarios(json.usuarios || [])
    } catch {
      toast.error('Erro ao carregar usuários.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarUsuarios() }, [])

  const criarUsuario = async (dados: CriarUsuarioForm) => {
    setSalvando(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Usuário criado com sucesso!')
      setDialogCriar(false)
      formCriar.reset()
      carregarUsuarios()
    } catch {
      toast.error('Erro ao criar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  const alterarSenha = async (dados: AlterarSenhaForm) => {
    if (!dialogSenha) return
    setSalvando(true)
    try {
      const res = await fetch(`/api/admin/${dialogSenha.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nova_senha: dados.nova_senha }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Senha alterada com sucesso!')
      setDialogSenha(null)
      formSenha.reset()
    } catch {
      toast.error('Erro ao alterar senha.')
    } finally {
      setSalvando(false)
    }
  }

  const alterarRole = async (usuario: Usuario, role: 'admin' | 'usuario') => {
    try {
      const res = await fetch(`/api/admin/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Permissão alterada!')
      carregarUsuarios()
    } catch {
      toast.error('Erro ao alterar permissão.')
    }
  }

  const excluirUsuario = async () => {
    if (!usuarioExcluindo) return
    try {
      const res = await fetch(`/api/admin/${usuarioExcluindo.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Usuário excluído!')
      setUsuarioExcluindo(null)
      carregarUsuarios()
    } catch {
      toast.error('Erro ao excluir usuário.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" /> Painel Administrador
          </h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setDialogCriar(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      {/* Lista de usuários */}
      <Card>
        <CardContent className="p-0">
          {carregando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
            <div className="divide-y">
              {usuarios.map((usuario) => (
                <div key={usuario.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{usuario.nome}</p>
                        <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {usuario.role}
                        </Badge>
                        {!usuario.ativo && (
                          <Badge variant="danger" className="text-xs">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em {formatarData(usuario.criado_em)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Alterar role */}
                    <Select
                      value={usuario.role}
                      onValueChange={(v) => alterarRole(usuario, v as any)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usuario">Usuário</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Alterar senha */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      onClick={() => { setDialogSenha(usuario); formSenha.reset() }}
                      title="Alterar senha"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </Button>
                    {/* Excluir */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setUsuarioExcluindo(usuario)}
                      title="Excluir usuário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog criar usuário */}
      <Dialog open={dialogCriar} onOpenChange={setDialogCriar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={formCriar.handleSubmit(criarUsuario)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" {...formCriar.register('nome')} />
              {formCriar.formState.errors.nome && (
                <p className="text-sm text-red-500">{formCriar.formState.errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="email@exemplo.com" {...formCriar.register('email')} />
              {formCriar.formState.errors.email && (
                <p className="text-sm text-red-500">{formCriar.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...formCriar.register('senha')} />
              {formCriar.formState.errors.senha && (
                <p className="text-sm text-red-500">{formCriar.formState.errors.senha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Permissão *</Label>
              <Select
                defaultValue="usuario"
                onValueChange={(v) => formCriar.setValue('role', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogCriar(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog alterar senha */}
      <Dialog open={!!dialogSenha} onOpenChange={() => setDialogSenha(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha — {dialogSenha?.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={formSenha.handleSubmit(alterarSenha)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Senha *</Label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...formSenha.register('nova_senha')} />
              {formSenha.formState.errors.nova_senha && (
                <p className="text-sm text-red-500">{formSenha.formState.errors.nova_senha.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha *</Label>
              <Input type="password" placeholder="Repita a senha" {...formSenha.register('confirmar_senha')} />
              {formSenha.formState.errors.confirmar_senha && (
                <p className="text-sm text-red-500">{formSenha.formState.errors.confirmar_senha.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogSenha(null)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Alterar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar exclusão */}
      <AlertDialog open={!!usuarioExcluindo} onOpenChange={() => setUsuarioExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{usuarioExcluindo?.nome}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirUsuario} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
