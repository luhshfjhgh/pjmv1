'use client'

// ============================================================
// PJM - Página de Importação
// ============================================================
import { useState, useRef } from 'react'
import { Upload, FileJson, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Exemplos de JSON para importação
const EXEMPLOS = {
  alunos: JSON.stringify(
    [
      { nome_completo: 'João Silva', telefone: '(11) 99999-0001', grupo_nome: 'Grupo A' },
      { nome_completo: 'Maria Santos', telefone: '(11) 99999-0002', grupo_nome: 'Grupo B' },
    ],
    null,
    2
  ),
  grupos: JSON.stringify(
    [
      { nome: 'Grupo A', descricao: 'Turma da manhã', cor: '#6366f1' },
      { nome: 'Grupo B', descricao: 'Turma da tarde', cor: '#22c55e' },
    ],
    null,
    2
  ),
}

export default function ImportacaoPage() {
  const [tipo, setTipo] = useState<'alunos' | 'grupos'>('alunos')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState<{
    sucesso: number
    erros: number
    mensagens: string[]
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setArquivo(file)
    setResultado(null)
  }

  const importar = async () => {
    if (!arquivo) {
      toast.warning('Selecione um arquivo para importar.')
      return
    }

    setImportando(true)
    try {
      const texto = await arquivo.text()
      let dados: any[]

      // Tenta parsear como JSON
      if (arquivo.name.endsWith('.json')) {
        dados = JSON.parse(texto)
      } else if (arquivo.name.endsWith('.xlsx') || arquivo.name.endsWith('.xls')) {
        // Para Excel, usa a biblioteca xlsx no cliente
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(await arquivo.arrayBuffer(), { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        dados = XLSX.utils.sheet_to_json(sheet)
      } else {
        toast.error('Formato não suportado. Use JSON ou Excel (.xlsx).')
        return
      }

      if (!Array.isArray(dados) || dados.length === 0) {
        toast.error('O arquivo não contém dados válidos.')
        return
      }

      const res = await fetch('/api/importacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, dados }),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.erro)
        return
      }

      setResultado(json)
      if (json.sucesso > 0) {
        toast.success(`${json.sucesso} registro(s) importado(s) com sucesso!`)
      }
      if (json.erros > 0) {
        toast.warning(`${json.erros} registro(s) com erro.`)
      }
    } catch (err) {
      toast.error('Erro ao processar arquivo. Verifique o formato.')
    } finally {
      setImportando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Importação</h1>
        <p className="text-muted-foreground">Importe dados de alunos ou grupos via JSON ou Excel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" /> Importar Dados
            </CardTitle>
            <CardDescription>
              Selecione o tipo de dado e faça o upload do arquivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Dado</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alunos">Alunos</SelectItem>
                  <SelectItem value="grupos">Grupos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Área de upload */}
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".json,.xlsx,.xls"
                onChange={handleArquivo}
                className="hidden"
              />
              {arquivo ? (
                <div className="space-y-2">
                  {arquivo.name.endsWith('.json') ? (
                    <FileJson className="w-10 h-10 mx-auto text-violet-500" />
                  ) : (
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-green-500" />
                  )}
                  <p className="font-medium text-sm">{arquivo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(arquivo.size / 1024).toFixed(1)} KB
                  </p>
                  <Badge variant="secondary">Clique para trocar</Badge>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="font-medium text-sm">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">JSON ou Excel (.xlsx)</p>
                </div>
              )}
            </div>

            <Button
              onClick={importar}
              disabled={!arquivo || importando}
              className="w-full gap-2"
            >
              {importando ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Importar
                </>
              )}
            </Button>

            {/* Resultado */}
            {resultado && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">{resultado.sucesso} importados</span>
                  </div>
                  {resultado.erros > 0 && (
                    <div className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{resultado.erros} erros</span>
                    </div>
                  )}
                </div>
                {resultado.mensagens.length > 0 && (
                  <div className="space-y-1">
                    {resultado.mensagens.map((msg, i) => (
                      <p key={i} className="text-xs text-red-600 dark:text-red-400">{msg}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exemplo de formato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" /> Formato Esperado
            </CardTitle>
            <CardDescription>
              Exemplo de arquivo JSON para importar {tipo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-xs overflow-auto max-h-64 border">
              <code>{EXEMPLOS[tipo]}</code>
            </pre>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Campos obrigatórios para {tipo}:</p>
              {tipo === 'alunos' ? (
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code>nome_completo</code> — Nome completo do aluno</li>
                  <li><code>telefone</code> — Telefone de contato</li>
                  <li><code>grupo_nome</code> — Nome do grupo (criado automaticamente se não existir)</li>
                </ul>
              ) : (
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li><code>nome</code> — Nome do grupo</li>
                  <li><code>descricao</code> — Descrição (opcional)</li>
                  <li><code>cor</code> — Cor em hexadecimal (opcional, padrão: #6366f1)</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
