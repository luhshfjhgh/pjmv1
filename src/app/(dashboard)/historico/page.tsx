'use client'

// ============================================================
// PJM - Página de Histórico
// ============================================================
import { useEffect, useState } from 'react'
import { History, Filter, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatarData } from '@/lib/utils'
import type { Historico, Grupo } from '@/types'

// Badge colorido por status
function BadgeStatus({ status }: { status: string }) {
  if (status === 'presente') {
    return (
      <Badge variant="success" className="gap-1 text-xs">
        <CheckCircle2 className="w-3 h-3" /> Presente
      </Badge>
    )
  }
  if (status === 'falta') {
    return (
      <Badge variant="danger" className="gap-1 text-xs">
        <XCircle className="w-3 h-3" /> Falta
      </Badge>
    )
  }
  return (
    <Badge variant="warning" className="gap-1 text-xs">
      <AlertCircle className="w-3 h-3" /> Justificada
    </Badge>
  )
}

export default function HistoricoPage() {
  const [historico, setHistorico] = useState<Historico[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const params = new URLSearchParams()
      if (dataInicio) params.set('data_inicio', dataInicio)
      if (dataFim) params.set('data_fim', dataFim)
      if (filtroGrupo !== 'todos') params.set('grupo_id', filtroGrupo)
      if (filtroStatus !== 'todos') params.set('status', filtroStatus)

      const [resHistorico, resGrupos] = await Promise.all([
        fetch(`/api/historico?${params}`),
        fetch('/api/grupos'),
      ])
      const [jsonHistorico, jsonGrupos] = await Promise.all([
        resHistorico.json(),
        resGrupos.json(),
      ])
      setHistorico(jsonHistorico.historico || [])
      setGrupos(jsonGrupos.grupos || [])
    } catch {
      toast.error('Erro ao carregar histórico.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregarDados() }, [])

  const aplicarFiltros = () => carregarDados()

  const limparFiltros = () => {
    setDataInicio('')
    setDataFim('')
    setFiltroGrupo('todos')
    setFiltroStatus('todos')
    // Recarrega sem filtros
    setTimeout(carregarDados, 0)
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Histórico</h1>
        <p className="text-muted-foreground">Registro completo de presenças</p>
      </div>

      {/* Painel de filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Data Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Data Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os grupos</SelectItem>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="presente">Presente</SelectItem>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="falta_justificada">Justificada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={aplicarFiltros} size="sm">Aplicar Filtros</Button>
            <Button onClick={limparFiltros} variant="outline" size="sm">Limpar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de histórico */}
      <Card>
        <CardContent className="p-0">
          {carregando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum registro encontrado.</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho da tabela */}
              <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-3 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                <span>Data</span>
                <span>Aluno</span>
                <span>Grupo</span>
                <span>Status</span>
              </div>

              {/* Linhas */}
              <div className="divide-y">
                {historico.map((item) => (
                  <div key={item.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
                    {/* Desktop */}
                    <div className="hidden md:grid grid-cols-4 gap-4 items-center">
                      <span className="text-sm text-muted-foreground">
                        {formatarData(item.data)}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {item.aluno?.nome_completo}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.grupo && (
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.grupo.cor }}
                          />
                        )}
                        <span className="text-sm truncate">{item.grupo?.nome}</span>
                      </div>
                      <BadgeStatus status={item.status} />
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.aluno?.nome_completo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(item.data)} · {item.grupo?.nome}
                        </p>
                      </div>
                      <BadgeStatus status={item.status} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé com total */}
              <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
                {historico.length} registro(s) encontrado(s)
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
