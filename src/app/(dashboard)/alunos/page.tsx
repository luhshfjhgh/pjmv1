'use client'

// ============================================================
// PJM - Página de Alunos
// ============================================================
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, UserCheck, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { classePresenca, classeBarraPresenca, formatarTelefone } from '@/lib/utils'
import type { Aluno, Grupo } from '@/types'

const alunoSchema = z.object({
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  grupo_id: z.string().uuid('Selecione um grupo'),
  telefone: z.string().min(8, 'Telefone inválido'),
  foto_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type AlunoForm = z.infer<typeof alunoSchema>

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [busca, setBusca] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [carregando, setCarregando] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null)
  const [alunoExcluindo, setAlunoExcluindo] = useState<Aluno | null>(null)
  const [salvando, setSalvando] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AlunoForm>({
    resolver: zodResolver(alunoSchema),
  })

  const carregarDados = async () => {
    try {
      const [resAlunos, resGrupos] = await Promise.all([
        fetch('/api/alunos'),
        fetch('/api/grupos'),
      ])
      const [jsonAlunos, jsonGrupos] = await Promise.all([resAlunos.json(), resGrupos.json()])
      setAlunos(jsonAlunos.alunos || [])
      setGrupos(jsonGrupos.grupos || [])
    } catch {
      toast.error('Erro ao carregar dados.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarDados() }, [])

  const abrirCriar = () => {
    setAlunoEditando(null)
    reset({ nome_completo: '', grupo_id: '', telefone: '', foto_url: '' })
    setDialogAberto(true)
  }

  const abrirEditar = (aluno: Aluno) => {
    setAlunoEditando(aluno)
    reset({
      nome_completo: aluno.nome_completo,
      grupo_id: aluno.grupo_id,
      telefone: aluno.telefone,
      foto_url: aluno.foto_url || '',
    })
    setDialogAberto(true)
  }

  const onSubmit = async (dados: AlunoForm) => {
    setSalvando(true)
    try {
      const payload = { ...dados, foto_url: dados.foto_url || null }
      const url = alunoEditando ? `/api/alunos/${alunoEditando.id}` : '/api/alunos'
      const method = alunoEditando ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success(alunoEditando ? 'Aluno atualizado!' : 'Aluno criado!')
      setDialogAberto(false)
      carregarDados()
    } catch {
      toast.error('Erro ao salvar aluno.')
    } finally {
      setSalvando(false)
    }
  }

  const excluirAluno = async () => {
    if (!alunoExcluindo) return
    try {
      const res = await fetch(`/api/alunos/${alunoExcluindo.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Aluno excluído!')
      setAlunoExcluindo(null)
      carregarDados()
    } catch {
      toast.error('Erro ao excluir aluno.')
    }
  }

  // Filtra e ordena alunos
  const alunosFiltrados = alunos
    .filter((a) => {
      const matchBusca =
        a.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
        a.telefone.includes(busca)
      const matchGrupo = filtroGrupo === 'todos' || a.grupo_id === filtroGrupo
      return matchBusca && matchGrupo
    })
    .sort((a, b) => a.nome_completo.localeCompare(b.nome_completo, 'pt-BR'))

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alunos</h1>
          <p className="text-muted-foreground">{alunos.length} aluno(s) cadastrado(s)</p>
        </div>
        <Button onClick={abrirCriar} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Aluno
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar alunos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filtrar por grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os grupos</SelectItem>
            {grupos.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de alunos */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum aluno encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alunosFiltrados.map((aluno) => {
            const percentual = aluno.percentual_presenca ?? 100
            return (
              <Card key={aluno.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ backgroundColor: aluno.grupo?.cor || '#6366f1' }}
                      >
                        {aluno.nome_completo.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {aluno.nome_completo}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span>{formatarTelefone(aluno.telefone)}</span>
                        </div>
                        {aluno.grupo && (
                          <Badge
                            variant="outline"
                            className="mt-1 text-xs"
                            style={{ borderColor: aluno.grupo.cor, color: aluno.grupo.cor }}
                          >
                            {aluno.grupo.nome}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Ações */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => abrirEditar(aluno)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => setAlunoExcluindo(aluno)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Barra de presença */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Presença</span>
                      <span className={`text-xs font-bold ${classePresenca(percentual)}`}>
                        {percentual}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${classeBarraPresenca(percentual)}`}
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog criar/editar */}
      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alunoEditando ? 'Editar Aluno' : 'Novo Aluno'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input id="nome_completo" placeholder="Nome completo do aluno" {...register('nome_completo')} />
              {errors.nome_completo && <p className="text-sm text-red-500">{errors.nome_completo.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Grupo *</Label>
              <Select onValueChange={(v) => setValue('grupo_id', v)} defaultValue={alunoEditando?.grupo_id}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grupo_id && <p className="text-sm text-red-500">{errors.grupo_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" placeholder="(11) 99999-9999" {...register('telefone')} />
              {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="foto_url">URL da Foto (opcional)</Label>
              <Input id="foto_url" placeholder="https://..." {...register('foto_url')} />
              {errors.foto_url && <p className="text-sm text-red-500">{errors.foto_url.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? 'Salvando...' : alunoEditando ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog exclusão */}
      <AlertDialog open={!!alunoExcluindo} onOpenChange={() => setAlunoExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{alunoExcluindo?.nome_completo}</strong>?
              Todas as presenças deste aluno também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirAluno} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
