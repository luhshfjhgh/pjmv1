'use client'

// ============================================================
// PJM - Página de Backup
// ============================================================
import { useEffect, useState } from 'react'
import { Database, Plus, Download, RotateCcw, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { formatarDataHora, formatarBytes } from '@/lib/utils'

interface BackupItem {
  id: string
  nome: string
  tamanho: number
  criado_em: string
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [criando, setCriando] = useState(false)
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [confirmRestaurar, setConfirmRestaurar] = useState<BackupItem | null>(null)

  const carregarBackups = async () => {
    try {
      const res = await fetch('/api/backup')
      const json = await res.json()
      setBackups(json.backups || [])
    } catch {
      toast.error('Erro ao carregar backups.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarBackups() }, [])

  const criarBackup = async () => {
    setCriando(true)
    try {
      const res = await fetch('/api/backup', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }

      toast.success('Backup criado com sucesso!')
      carregarBackups()

      // Oferece download automático
      const blob = new Blob([JSON.stringify(json.dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${json.backup.nome}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Erro ao criar backup.')
    } finally {
      setCriando(false)
    }
  }

  const baixarBackup = async (backup: BackupItem) => {
    try {
      const res = await fetch(`/api/backup/${backup.id}`)
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }

      const blob = new Blob([JSON.stringify(json.backup.dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${backup.nome}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup baixado!')
    } catch {
      toast.error('Erro ao baixar backup.')
    }
  }

  const restaurarBackup = async () => {
    if (!confirmRestaurar) return
    setRestaurandoId(confirmRestaurar.id)
    try {
      const res = await fetch(`/api/backup/${confirmRestaurar.id}`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Backup restaurado com sucesso!')
      setConfirmRestaurar(null)
    } catch {
      toast.error('Erro ao restaurar backup.')
    } finally {
      setRestaurandoId(null)
    }
  }

  const excluirBackup = async () => {
    if (!excluindoId) return
    try {
      const res = await fetch(`/api/backup/${excluindoId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Backup excluído!')
      setExcluindoId(null)
      carregarBackups()
    } catch {
      toast.error('Erro ao excluir backup.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backup</h1>
          <p className="text-muted-foreground">Gerencie os backups do sistema</p>
        </div>
        <Button onClick={criarBackup} disabled={criando} className="gap-2">
          {criando ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Criar Backup
            </>
          )}
        </Button>
      </div>

      {/* Informações */}
      <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Sobre os Backups
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Os backups contêm todos os dados do sistema: grupos, alunos, presenças e histórico.
                Recomenda-se criar backups regularmente. A restauração substituirá os dados existentes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de backups */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Backups Disponíveis</CardTitle>
          <CardDescription>{backups.length} backup(s) armazenado(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {carregando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum backup disponível.</p>
              <p className="text-sm mt-1">Clique em "Criar Backup" para começar.</p>
            </div>
          ) : (
            <div className="divide-y">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                      <Database className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{backup.nome}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{formatarDataHora(backup.criado_em)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {formatarBytes(backup.tamanho)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => baixarBackup(backup)}
                      title="Baixar backup"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      onClick={() => setConfirmRestaurar(backup)}
                      disabled={restaurandoId === backup.id}
                      title="Restaurar backup"
                    >
                      {restaurandoId === backup.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <RotateCcw className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => setExcluindoId(backup.id)}
                      title="Excluir backup"
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

      {/* Dialog confirmar restauração */}
      <AlertDialog open={!!confirmRestaurar} onOpenChange={() => setConfirmRestaurar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar o backup <strong>{confirmRestaurar?.nome}</strong>?
              Esta ação irá sobrescrever os dados atuais do sistema. Esta operação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={restaurarBackup}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog confirmar exclusão */}
      <AlertDialog open={!!excluindoId} onOpenChange={() => setExcluindoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluirBackup} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
