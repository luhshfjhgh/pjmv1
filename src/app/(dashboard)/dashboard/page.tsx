'use client'

// ============================================================
// PJM - Página Dashboard
// ============================================================
import { useEffect, useState } from 'react'
import {
  Users,
  UserCheck,
  TrendingUp,
  XCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { EstatisticasDashboard } from '@/types'

// Cartão de estatística individual
function StatCard({
  titulo,
  valor,
  icone: Icone,
  cor,
  descricao,
}: {
  titulo: string
  valor: number | string
  icone: any
  cor: string
  descricao?: string
}) {
  return (
    <Card className="transition-all hover:shadow-lg hover:scale-[1.02] animate-scale-in">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
            <p className="text-3xl font-bold mt-1">{valor}</p>
            {descricao && (
              <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cor}`}>
            <Icone className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [estatisticas, setEstatisticas] = useState<EstatisticasDashboard | null>(null)
  const [presencaPorMes, setPresencaPorMes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const resposta = await fetch('/api/historico/estatisticas')
        const json = await resposta.json()
        setEstatisticas(json.estatisticas)
        setPresencaPorMes(json.presencaPorMes || [])
      } catch {
        console.error('Erro ao carregar estatísticas')
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [])

  // Dados para o gráfico de pizza (status de presença)
  const dadosPizza = estatisticas
    ? [
        { name: 'Presentes', value: estatisticas.total_presentes, color: '#22c55e' },
        { name: 'Faltas', value: estatisticas.total_faltas, color: '#ef4444' },
        { name: 'Just.', value: estatisticas.total_faltas_justificadas, color: '#eab308' },
      ].filter((d) => d.value > 0)
    : []

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de presença</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <StatCard
          titulo="Total de Grupos"
          valor={estatisticas?.total_grupos ?? 0}
          icone={Users}
          cor="bg-violet-500"
        />
        <StatCard
          titulo="Total de Alunos"
          valor={estatisticas?.total_alunos ?? 0}
          icone={UserCheck}
          cor="bg-blue-500"
        />
        <StatCard
          titulo="Média de Presença"
          valor={`${estatisticas?.media_presenca ?? 100}%`}
          icone={TrendingUp}
          cor={
            (estatisticas?.media_presenca ?? 100) >= 70 ? 'bg-green-500' : 'bg-red-500'
          }
          descricao="Percentual geral"
        />
        <StatCard
          titulo="Presenças"
          valor={estatisticas?.total_presentes ?? 0}
          icone={CheckCircle2}
          cor="bg-green-500"
        />
        <StatCard
          titulo="Faltas"
          valor={estatisticas?.total_faltas ?? 0}
          icone={XCircle}
          cor="bg-red-500"
        />
        <StatCard
          titulo="Faltas Justificadas"
          valor={estatisticas?.total_faltas_justificadas ?? 0}
          icone={AlertCircle}
          cor="bg-yellow-500"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {/* Gráfico de barras - Presença por mês */}
        <Card>
          <CardHeader>
            <CardTitle>Presença por Mês</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {presencaPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={presencaPorMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const [ano, mes] = v.split('-')
                      const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
                      return nomes[parseInt(mes) - 1]
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [value, name === 'presentes' ? 'Presentes' : name === 'faltas' ? 'Faltas' : 'Justificadas']}
                  />
                  <Bar dataKey="presentes" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="faltas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="justificadas" fill="#eab308" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de pizza - Distribuição de status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Presença</CardTitle>
            <CardDescription>Total geral de registros</CardDescription>
          </CardHeader>
          <CardContent>
            {dadosPizza.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p className="text-sm">Nenhum dado disponível ainda.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
