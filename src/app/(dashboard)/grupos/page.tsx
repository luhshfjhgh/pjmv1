'use client'

// ============================================================
// PJM - Página de Grupos
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import type { Grupo } from '@/types'

const grupoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
})

type GrupoForm = z.infer<typeof grupoSchema>

// Cores predefinidas para grupos
const CORES_PREDEFINIDAS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#84cc16', '#a855f7',
]

export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [grupoEditando, setGrupoEditando] = useState<Grupo | null>(null)
  const [grupoExcluindo, setGrupoExcluindo] = useState<Grupo | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GrupoForm>({
    resolver: zodResolver(grupoSchema),
    defaultValues: { cor: '#6366f1' },
  })

  const corSelecionada = watch('cor')

  const carregarGrupos = async () => {
    try {
      const res = await fetch('/api/grupos')
      const json = await res.json()
      setGrupos(json.grupos || [])
    } catch {
      toast.error('Erro ao carregar grupos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarGrupos() }, [])

  const abrirCriar = () => {
    setGrupoEditando(null)
    reset({ nome: '', descricao: '', cor: '#6366f1' })
    setDialogAberto(true)
  }

  const abrirEditar = (grupo: Grupo) => {
    setGrupoEditando(grupo)
    reset({ nome: grupo.nome, descricao: grupo.descricao || '', cor: grupo.cor })
    setDialogAberto(true)
  }

  const onSubmit = async (dados: GrupoForm) => {
    setSalvando(true)
    try {
      const url = grupoEditando ? `/api/grupos/${grupoEditando.id}` : '/api/grupos'
      const method = grupoEditando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success(grupoEditando ? 'Grupo atualizado!' : 'Grupo criado!')
      setDialogAberto(false)
      carregarGrupos()
    } catch {
      toast.error('Erro ao salvar grupo.')
    } finally {
      setSalvando(false)
    }
  }

  const excluirGrupo = async () => {
    if (!grupoExcluindo) return
    try {
      const res = await fetch(`/api/grupos/${grupoExcluindo.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Grupo excluído!')
      setGrupoExcluindo(null)
      carregarGrupos()
    } catch {
      toast.error('Erro ao excluir grupo.')
    }
  }

  const gruposFiltrados = grupos.filter((g) =>
    g.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (g.descricao || '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grupos</h1>
          <p className="text-muted-foreground">{grupos.length} grupo(s) cadastrado(s)</p>
        </div>
        <Button onClick={abrirCriar} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Grupo
        </Button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar grupos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de grupos */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gruposFiltrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum grupo encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gruposFiltrados.map((grupo) => (
            <Card key={grupo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Indicador de cor */}
                    <div
                      className="w-10 h-10 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: grupo.cor }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {grupo.nome}
                      </h3>
                      {grupo.descricao && (
                        <p className="text-sm text-muted-foreground truncate">{grupo.descricao}</p>
                      )}
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {grupo.total_alunos ?? 0} aluno(s)
                      </Badge>
                    </div>
                  </div>
                  {/* Ações */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => abrirEditar(grupo)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setGrupoExcluindo(grupo)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{grupoEditando ? 'Editar Grupo' : 'Novo Grupo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" placeholder="Nome do grupo" {...register('nome')} />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" placeholder="Descrição opcional..." {...register('descricao')} />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {CORES_PREDEFINIDAS.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setValue('cor', cor)}
                    className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                      corSelecionada === cor ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110' : ''
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register('cor')}
                  className="w-10 h-10 rounded cursor-pointer border border-input"
                />
                <span className="text-sm text-muted-foreground">Cor personalizada</span>
              </div>
              {errors.cor && <p className="text-sm text-red-500">{errors.cor.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : grupoEditando ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!grupoExcluindo} onOpenChange={() => setGrupoExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo <strong>{grupoExcluindo?.nome}</strong>?
              Esta ação não pode ser desfeita. Grupos com alunos vinculados não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluirGrupo}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
