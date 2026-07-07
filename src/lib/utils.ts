// ============================================================
// PJM - Utilitários Gerais
// ============================================================
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Combina classes CSS com suporte a Tailwind merge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata uma data ISO para exibição em português.
 */
export function formatarData(data: string, formato = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(data), formato, { locale: ptBR })
  } catch {
    return data
  }
}

/**
 * Formata uma data ISO com hora.
 */
export function formatarDataHora(data: string): string {
  return formatarData(data, "dd/MM/yyyy 'às' HH:mm")
}

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD).
 */
export function dataAtualISO(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calcula o percentual de presença de um aluno.
 * @param presentes - Número de presenças
 * @param total - Total de chamadas
 */
export function calcularPercentualPresenca(presentes: number, total: number): number {
  if (total === 0) return 100
  return Math.round((presentes / total) * 100)
}

/**
 * Retorna a cor de acordo com o percentual de presença.
 * Verde acima de 70%, vermelho abaixo.
 */
export function corPresenca(percentual: number): 'green' | 'red' {
  return percentual >= 70 ? 'green' : 'red'
}

/**
 * Retorna as classes Tailwind para o percentual de presença.
 */
export function classePresenca(percentual: number): string {
  return percentual >= 70
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400'
}

/**
 * Retorna as classes Tailwind para a barra de progresso de presença.
 */
export function classeBarraPresenca(percentual: number): string {
  return percentual >= 70 ? 'bg-green-500' : 'bg-red-500'
}

/**
 * Formata o status de presença para exibição.
 */
export function formatarStatus(status: string): string {
  const mapa: Record<string, string> = {
    presente: 'Presente',
    falta: 'Falta',
    falta_justificada: 'Falta Justificada',
  }
  return mapa[status] || status
}

/**
 * Formata bytes para exibição legível (KB, MB, etc.).
 */
export function formatarBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Ordena um array de objetos alfabeticamente por uma propriedade string.
 */
export function ordenarAlfabeticamente<T>(arr: T[], chave: keyof T): T[] {
  return [...arr].sort((a, b) => {
    const va = String(a[chave]).toLowerCase()
    const vb = String(b[chave]).toLowerCase()
    return va.localeCompare(vb, 'pt-BR')
  })
}

/**
 * Gera um ID único simples (para uso temporário no frontend).
 */
export function gerarId(): string {
  return Math.random().toString(36).substring(2, 9)
}

/**
 * Valida formato de telefone brasileiro.
 */
export function validarTelefone(telefone: string): boolean {
  const regex = /^(\+55\s?)?(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/
  return regex.test(telefone.replace(/\s/g, ''))
}

/**
 * Formata telefone para exibição.
 */
export function formatarTelefone(telefone: string): string {
  const nums = telefone.replace(/\D/g, '')
  if (nums.length === 11) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`
  }
  if (nums.length === 10) {
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`
  }
  return telefone
}
