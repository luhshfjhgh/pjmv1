// ============================================================
// PJM - Camada de Dados: Usuários
// ============================================================
import { createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import type { Usuario } from '@/types'

/**
 * Busca um usuário pelo email.
 */
export async function buscarUsuarioPorEmail(email: string): Promise<Usuario | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .eq('ativo', true)
    .single()

  console.log('=== BUSCA NO BANCO ===')
  console.log('Error do Supabase:', error)
  console.log('Data encontrada:', data ? 'SIM' : 'NÃO')

  if (error || !data) return null
  return data as Usuario
}

/**
 * Busca um usuário pelo ID.
 */
export async function buscarUsuarioPorId(id: string): Promise<Usuario | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, ativo, criado_em, atualizado_em')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as Usuario
}

/**
 * Lista todos os usuários (sem senha_hash).
 */
export async function listarUsuarios(): Promise<Usuario[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, role, ativo, criado_em, atualizado_em')
    .order('nome')

  if (error || !data) return []
  return data as Usuario[]
}

/**
 * Cria um novo usuário com senha criptografada.
 */
export async function criarUsuario(dados: {
  nome: string
  email: string
  senha: string
  role: 'admin' | 'usuario'
}): Promise<{ usuario?: Usuario; erro?: string }> {
  const supabase = createAdminClient()

  const { data: existente } = await supabase
    .from('usuarios')
    .select('id')
    .eq('email', dados.email.toLowerCase().trim())
    .single()

  if (existente) {
    return { erro: 'Este email já está cadastrado.' }
  }

  const senha_hash = await bcrypt.hash(dados.senha, 12)

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nome: dados.nome.trim(),
      email: dados.email.toLowerCase().trim(),
      senha_hash,
      role: dados.role,
    })
    .select('id, nome, email, role, ativo, criado_em, atualizado_em')
    .single()

  if (error || !data) {
    return { erro: 'Erro ao criar usuário.' }
  }

  return { usuario: data as Usuario }
}

/**
 * Atualiza dados de um usuário.
 */
export async function atualizarUsuario(
  id: string,
  dados: Partial<{ nome: string; email: string; role: 'admin' | 'usuario'; ativo: boolean }>
): Promise<{ usuario?: Usuario; erro?: string }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('usuarios')
    .update(dados)
    .eq('id', id)
    .select('id, nome, email, role, ativo, criado_em, atualizado_em')
    .single()

  if (error || !data) {
    return { erro: 'Erro ao atualizar usuário.' }
  }

  return { usuario: data as Usuario }
}

/**
 * Altera a senha de um usuário.
 */
export async function alterarSenha(
  id: string,
  novaSenha: string
): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createAdminClient()
  const senha_hash = await bcrypt.hash(novaSenha, 12)

  const { error } = await supabase
    .from('usuarios')
    .update({ senha_hash })
    .eq('id', id)

  if (error) return { sucesso: false, erro: 'Erro ao alterar senha.' }
  return { sucesso: true }
}

/**
 * Exclui (desativa) um usuário.
 */
export async function excluirUsuario(id: string): Promise<{ sucesso: boolean; erro?: string }> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('usuarios')
    .update({ ativo: false })
    .eq('id', id)

  if (error) return { sucesso: false, erro: 'Erro ao excluir usuário.' }
  return { sucesso: true }
}

/**
 * Verifica as credenciais de login.
 */
export async function verificarCredenciais(
  email: string,
  senha: string
): Promise<{ usuario?: Usuario; erro?: string }> {
  const usuario = await buscarUsuarioPorEmail(email)

  console.log('=== DEBUG LOGIN ===')
  console.log('Usuário encontrado:', usuario ? 'SIM' : 'NÃO')

  if (!usuario) {
    return { erro: 'Email ou senha incorretos.' }
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash!)
  console.log('Senha correta:', senhaCorreta)

  if (!senhaCorreta) {
    return { erro: 'Email ou senha incorretos.' }
  }

  return { usuario }
}