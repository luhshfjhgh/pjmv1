'use client'

// ============================================================
// PJM - Página de Chamada
// ============================================================
import { useEffect, useState } from 'react'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react'
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
import { classePresenca, classeBarraPresenca, dataAtualISO, formatarData } from '@/lib/utils'
import type { Aluno, Grupo, StatusPresenca, DadosChamada } from '@/types'

// Botão de status de presença
function BotaoStatus({
  status,
  atual,
  onClick,
}: {
  status: StatusPresenca
  atual: StatusPresenca | null
  onClick: () => void
}) {
  const configs = {
    presente: {
      label: 'Presente',
      icon: CheckCircle2,
      ativo: 'bg-green-500 text-white border-green-500',
      inativo: 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950',
    },
    falta: {
      label: 'Falta',
      icon: XCircle,
      ativo: 'bg-red-500 text-white border-red-500',
      inativo: 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950',
    },
    falta_justificada: {
      label: 'Justificada',
      icon: AlertCircle,
      ativo: 'bg-yellow-500 text-white border-yellow-500',
      inativo: 'border-yellow-300 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950',
    },
  }

  const config = configs[status]
  const Icone = config.icon
  const ativo = atual === status

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
        ativo ? config.ativo : config.inativo
      }`}
    >
      <Icone className="w-3.5 h-3.5" />
      {config.label}
    </button>
  )
}

export default function ChamadaPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [grupoSelecionado, setGrupoSelecionado] = useState('')
  const [data, setData] = useState(dataAtualISO())
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [chamada, setChamada] = useState<Record<string, DadosChamada>>({})
  const [carregando, setCarregando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Carrega grupos ao montar
  useEffect(() => {
    fetch('/api/grupos')
      .then((r) => r.json())
      .then((j) => setGrupos(j.grupos || []))
  }, [])

  // Carrega alunos quando grupo ou data muda
  useEffect(() => {
    if (!grupoSelecionado) return
    setCarregando(true)

    Promise.all([
      fetch(`/api/alunos?grupo_id=${grupoSelecionado}`).then((r) => r.json()),
      fetch(`/api/chamada?grupo_id=${grupoSelecionado}&data=${data}`).then((r) => r.json()),
    ])
      .then(([jsonAlunos, jsonChamada]) => {
        const alunosList: Aluno[] = jsonAlunos.alunos || []
        setAlunos(alunosList)

        // Monta o estado da chamada
        const novaChamada: Record<string, DadosChamada> = {}
        alunosList.forEach((aluno) => {
          const presencaExistente = jsonChamada.presencas?.find(
            (p: any) => p.aluno_id === aluno.id
          )
          novaChamada[aluno.id] = {
            aluno,
            status: presencaExistente?.status || null,
            observacao: presencaExistente?.observacao || '',
          }
        })
        setChamada(novaChamada)
      })
      .catch(() => toast.error('Erro ao carregar dados.'))
      .finally(() => setCarregando(false))
  }, [grupoSelecionado, data])

  const setStatus = (alunoId: string, status: StatusPresenca) => {
    setChamada((prev) => ({
      ...prev,
      [alunoId]: { ...prev[alunoId], status },
    }))
  }

  // Marca todos como presente
  const marcarTodos = (status: StatusPresenca) => {
    setChamada((prev) => {
      const novo = { ...prev }
      Object.keys(novo).forEach((id) => {
        novo[id] = { ...novo[id], status }
      })
      return novo
    })
  }

  const salvarChamada = async () => {
    const chamadas = Object.values(chamada)
      .filter((c) => c.status !== null)
      .map((c) => ({
        aluno_id: c.aluno.id,
        data,
        status: c.status!,
        observacao: c.observacao,
      }))

    if (chamadas.length === 0) {
      toast.warning('Marque pelo menos um aluno antes de salvar.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/chamada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chamadas }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.erro); return }
      toast.success('Chamada salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar chamada.')
    } finally {
      setSalvando(false)
    }
  }

  // Contagens
  const presentes = Object.values(chamada).filter((c) => c.status === 'presente').length
  const faltas = Object.values(chamada).filter((c) => c.status === 'falta').length
  const justificadas = Object.values(chamada).filter((c) => c.status === 'falta_justificada').length
  const naoMarcados = Object.values(chamada).filter((c) => c.status === null).length

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chamada</h1>
        <p className="text-muted-foreground">Registre a presença dos alunos</p>
      </div>

      {/* Seleção de grupo e data */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <Label>Grupo</Label>
              <Select value={grupoSelecionado} onValueChange={setGrupoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48 space-y-1">
              <Label>Data</Label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                max={dataAtualISO()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo da chamada */}
      {grupoSelecionado && (
        <>
          {/* Resumo e ações rápidas */}
          {alunos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {presentes} presentes
                </Badge>
                <Badge variant="danger" className="gap-1">
                  <XCircle className="w-3 h-3" /> {faltas} faltas
                </Badge>
                <Badge variant="warning" className="gap-1">
                  <AlertCircle className="w-3 h-3" /> {justificadas} justificadas
                </Badge>
                {naoMarcados > 0 && (
                  <Badge variant="outline" className="gap-1">
                    {naoMarcados} não marcados
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => marcarTodos('presente')}>
                  Todos Presentes
                </Button>
                <Button variant="outline" size="sm" onClick={() => marcarTodos('falta')}>
                  Todos Faltaram
                </Button>
              </div>
            </div>
          )}

          {/* Lista de alunos */}
          {carregando ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : alunos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum aluno neste grupo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alunos.map((aluno) => {
                const dadosAluno = chamada[aluno.id]
                const percentual = aluno.percentual_presenca ?? 100
                return (
                  <Card key={aluno.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Info do aluno */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: aluno.grupo?.cor || '#6366f1' }}
                          >
                            {aluno.nome_completo.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                              {aluno.nome_completo}
                            </p>
                            <p className={`text-xs font-semibold ${classePresenca(percentual)}`}>
                              {percentual}% de presença
                            </p>
                          </div>
                        </div>

                        {/* Botões de status */}
                        <div className="flex gap-2 flex-wrap">
                          <BotaoStatus
                            status="presente"
                            atual={dadosAluno?.status || null}
                            onClick={() => setStatus(aluno.id, 'presente')}
                          />
                          <BotaoStatus
                            status="falta"
                            atual={dadosAluno?.status || null}
                            onClick={() => setStatus(aluno.id, 'falta')}
                          />
                          <BotaoStatus
                            status="falta_justificada"
                            atual={dadosAluno?.status || null}
                            onClick={() => setStatus(aluno.id, 'falta_justificada')}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Botão salvar */}
          {alunos.length > 0 && (
            <div className="flex justify-end pt-2">
              <Button onClick={salvarChamada} disabled={salvando} className="gap-2 px-8">
                <Save className="w-4 h-4" />
                {salvando ? 'Salvando...' : 'Salvar Chamada'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Estado inicial */}
      {!grupoSelecionado && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Selecione um grupo para iniciar a chamada</p>
          <p className="text-sm mt-1">Escolha o grupo e a data acima</p>
        </div>
      )}
    </div>
  )
}
