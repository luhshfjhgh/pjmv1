// ============================================================
// PJM - API Route: Importação de Dados
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { obterSessao } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Schema de validação para aluno importado
const alunoImportSchema = z.object({
  nome_completo: z.string().min(3),
  telefone: z.string().min(8),
  grupo_nome: z.string().min(1),
})

// Schema de validação para grupo importado
const grupoImportSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  cor: z.string().optional(),
})

/**
 * POST /api/importacao
 * Importa dados de alunos ou grupos a partir de JSON.
 * Body: { tipo: 'alunos' | 'grupos', dados: [...] }
 */
export async function POST(request: NextRequest) {
  const sessao = await obterSessao()
  if (!sessao) return NextResponse.json({ erro: 'Não autorizado.' }, { status: 401 })

  try {
    const body = await request.json()
    const { tipo, dados } = body

    if (!tipo || !Array.isArray(dados)) {
      return NextResponse.json({ erro: 'Formato inválido.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let sucesso = 0
    let erros = 0
    const mensagens: string[] = []

    if (tipo === 'grupos') {
      for (const item of dados) {
        const resultado = grupoImportSchema.safeParse(item)
        if (!resultado.success) {
          erros++
          mensagens.push(`Grupo inválido: ${JSON.stringify(item)}`)
          continue
        }

        const { error } = await supabase.from('grupos').insert({
          nome: resultado.data.nome.trim(),
          descricao: resultado.data.descricao?.trim() || null,
          cor: resultado.data.cor || '#6366f1',
        })

        if (error) {
          erros++
          mensagens.push(`Erro ao importar grupo "${resultado.data.nome}": ${error.message}`)
        } else {
          sucesso++
        }
      }
    } else if (tipo === 'alunos') {
      for (const item of dados) {
        const resultado = alunoImportSchema.safeParse(item)
        if (!resultado.success) {
          erros++
          mensagens.push(`Aluno inválido: ${JSON.stringify(item)}`)
          continue
        }

        // Busca ou cria o grupo pelo nome
        let { data: grupo } = await supabase
          .from('grupos')
          .select('id')
          .ilike('nome', resultado.data.grupo_nome.trim())
          .single()

        if (!grupo) {
          const { data: novoGrupo, error: errGrupo } = await supabase
            .from('grupos')
            .insert({ nome: resultado.data.grupo_nome.trim(), cor: '#6366f1' })
            .select('id')
            .single()

          if (errGrupo || !novoGrupo) {
            erros++
            mensagens.push(`Erro ao criar grupo "${resultado.data.grupo_nome}"`)
            continue
          }
          grupo = novoGrupo
        }

        const { error } = await supabase.from('alunos').insert({
          nome_completo: resultado.data.nome_completo.trim(),
          telefone: resultado.data.telefone.trim(),
          grupo_id: grupo.id,
        })

        if (error) {
          erros++
          mensagens.push(`Erro ao importar aluno "${resultado.data.nome_completo}": ${error.message}`)
        } else {
          sucesso++
        }
      }
    } else {
      return NextResponse.json({ erro: 'Tipo de importação inválido.' }, { status: 400 })
    }

    return NextResponse.json({ sucesso, erros, mensagens })
  } catch (error) {
    console.error('Erro na importação:', error)
    return NextResponse.json({ erro: 'Erro interno na importação.' }, { status: 500 })
  }
}
