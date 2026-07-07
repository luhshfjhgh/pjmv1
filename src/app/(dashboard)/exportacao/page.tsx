'use client'

// ============================================================
// PJM - Página de Exportação
// ============================================================
import { useState } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Cartão de opção de exportação
function CartaoExportacao({
  titulo,
  descricao,
  tipo,
  onExportarJSON,
  onExportarExcel,
  carregando,
}: {
  titulo: string
  descricao: string
  tipo: string
  onExportarJSON: (tipo: string) => void
  onExportarExcel: (tipo: string) => void
  carregando: string | null
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onExportarJSON(tipo)}
            disabled={carregando !== null}
          >
            {carregando === `${tipo}-json` ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileJson className="w-4 h-4 text-violet-500" />
            )}
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onExportarExcel(tipo)}
            disabled={carregando !== null}
          >
            {carregando === `${tipo}-xlsx` ? (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-green-500" />
            )}
            Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExportacaoPage() {
  const [carregando, setCarregando] = useState<string | null>(null)

  const exportarJSON = async (tipo: string) => {
    setCarregando(`${tipo}-json`)
    try {
      const res = await fetch(`/api/exportacao?tipo=${tipo}`)
      if (!res.ok) { toast.error('Erro ao exportar.'); return }
      const dados = await res.json()

      // Cria e baixa o arquivo JSON
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pjm_${tipo}_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Arquivo JSON exportado!')
    } catch {
      toast.error('Erro ao exportar.')
    } finally {
      setCarregando(null)
    }
  }

  const exportarExcel = async (tipo: string) => {
    setCarregando(`${tipo}-xlsx`)
    try {
      const res = await fetch(`/api/exportacao?tipo=${tipo}`)
      if (!res.ok) { toast.error('Erro ao exportar.'); return }
      const dados = await res.json()

      // Importa xlsx dinamicamente
      const XLSX = await import('xlsx')
      const workbook = XLSX.utils.book_new()

      // Cria abas para cada tipo de dado
      const chaves = Object.keys(dados)
      chaves.forEach((chave) => {
        if (Array.isArray(dados[chave]) && dados[chave].length > 0) {
          const sheet = XLSX.utils.json_to_sheet(dados[chave])
          XLSX.utils.book_append_sheet(workbook, sheet, chave.charAt(0).toUpperCase() + chave.slice(1))
        }
      })

      if (workbook.SheetNames.length === 0) {
        toast.warning('Nenhum dado para exportar.')
        return
      }

      XLSX.writeFile(workbook, `pjm_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Arquivo Excel exportado!')
    } catch {
      toast.error('Erro ao exportar.')
    } finally {
      setCarregando(null)
    }
  }

  const opcoes = [
    {
      titulo: 'Grupos',
      descricao: 'Exportar todos os grupos cadastrados',
      tipo: 'grupos',
    },
    {
      titulo: 'Alunos',
      descricao: 'Exportar todos os alunos em ordem alfabética',
      tipo: 'alunos',
    },
    {
      titulo: 'Histórico',
      descricao: 'Exportar histórico completo de presenças',
      tipo: 'historico',
    },
    {
      titulo: 'Exportação Completa',
      descricao: 'Exportar todos os dados do sistema',
      tipo: 'completo',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exportação</h1>
        <p className="text-muted-foreground">
          Exporte os dados do sistema em JSON ou Excel (ordem alfabética)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {opcoes.map((opcao) => (
          <CartaoExportacao
            key={opcao.tipo}
            titulo={opcao.titulo}
            descricao={opcao.descricao}
            tipo={opcao.tipo}
            onExportarJSON={exportarJSON}
            onExportarExcel={exportarExcel}
            carregando={carregando}
          />
        ))}
      </div>

      {/* Nota informativa */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Sobre a exportação
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Todos os dados são exportados em ordem alfabética. O formato JSON é ideal para
                importação em outros sistemas, enquanto o Excel facilita a visualização e edição
                manual dos dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
