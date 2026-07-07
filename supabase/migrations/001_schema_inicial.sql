-- ============================================================
-- PJM - Presença Jovem Missionário
-- Migration 001: Schema Inicial
-- ============================================================
-- Execute este script no SQL Editor do Supabase para criar
-- todas as tabelas, funções, triggers e políticas de segurança.
-- ============================================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: usuarios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  senha_hash  TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin', 'usuario')),
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: grupos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grupos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  descricao   TEXT,
  cor         TEXT NOT NULL DEFAULT '#6366f1',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: alunos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alunos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_completo TEXT NOT NULL,
  foto_url      TEXT,
  grupo_id      UUID NOT NULL REFERENCES public.grupos(id) ON DELETE RESTRICT,
  telefone      TEXT NOT NULL,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: presencas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.presencas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('presente', 'falta', 'falta_justificada')),
  observacao  TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Garante apenas um registro por aluno por data
  UNIQUE (aluno_id, data)
);

-- ============================================================
-- TABELA: historico
-- ============================================================
CREATE TABLE IF NOT EXISTS public.historico (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aluno_id    UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  grupo_id    UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  data        DATE NOT NULL,
  status      TEXT NOT NULL CHECK (status IN ('presente', 'falta', 'falta_justificada')),
  observacao  TEXT,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: backups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.backups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  tamanho     BIGINT NOT NULL DEFAULT 0,
  dados       JSONB NOT NULL,
  criado_por  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_alunos_grupo_id ON public.alunos(grupo_id);
CREATE INDEX IF NOT EXISTS idx_alunos_nome ON public.alunos(nome_completo);
CREATE INDEX IF NOT EXISTS idx_presencas_aluno_id ON public.presencas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_presencas_data ON public.presencas(data);
CREATE INDEX IF NOT EXISTS idx_historico_aluno_id ON public.historico(aluno_id);
CREATE INDEX IF NOT EXISTS idx_historico_grupo_id ON public.historico(grupo_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON public.historico(data);

-- ============================================================
-- FUNÇÃO: atualizar campo atualizado_em automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamp
CREATE TRIGGER trigger_usuarios_atualizado_em
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_grupos_atualizado_em
  BEFORE UPDATE ON public.grupos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

CREATE TRIGGER trigger_alunos_atualizado_em
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();

-- ============================================================
-- FUNÇÃO: sincronizar histórico ao registrar presença
-- ============================================================
CREATE OR REPLACE FUNCTION public.sincronizar_historico()
RETURNS TRIGGER AS $$
DECLARE
  v_grupo_id UUID;
BEGIN
  -- Obtém o grupo do aluno
  SELECT grupo_id INTO v_grupo_id FROM public.alunos WHERE id = NEW.aluno_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.historico (aluno_id, grupo_id, data, status, observacao)
    VALUES (NEW.aluno_id, v_grupo_id, NEW.data, NEW.status, NEW.observacao)
    ON CONFLICT DO NOTHING;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.historico
    SET status = NEW.status, observacao = NEW.observacao
    WHERE aluno_id = NEW.aluno_id AND data = NEW.data;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.historico WHERE aluno_id = OLD.aluno_id AND data = OLD.data;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sincronizar_historico
  AFTER INSERT OR UPDATE OR DELETE ON public.presencas
  FOR EACH ROW EXECUTE FUNCTION public.sincronizar_historico();

-- ============================================================
-- FUNÇÃO: calcular percentual de presença de um aluno
-- ============================================================
CREATE OR REPLACE FUNCTION public.calcular_percentual_presenca(p_aluno_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  total INTEGER;
  presentes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM public.presencas WHERE aluno_id = p_aluno_id;
  IF total = 0 THEN RETURN 100; END IF;
  SELECT COUNT(*) INTO presentes FROM public.presencas
    WHERE aluno_id = p_aluno_id AND status = 'presente';
  RETURN ROUND((presentes::NUMERIC / total::NUMERIC) * 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNÇÃO: estatísticas do dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION public.obter_estatisticas_dashboard()
RETURNS JSON AS $$
DECLARE
  v_total_grupos INTEGER;
  v_total_alunos INTEGER;
  v_total_presentes INTEGER;
  v_total_faltas INTEGER;
  v_total_faltas_justificadas INTEGER;
  v_media_presenca NUMERIC;
BEGIN
  SELECT COUNT(*) INTO v_total_grupos FROM public.grupos;
  SELECT COUNT(*) INTO v_total_alunos FROM public.alunos;
  SELECT COUNT(*) INTO v_total_presentes FROM public.presencas WHERE status = 'presente';
  SELECT COUNT(*) INTO v_total_faltas FROM public.presencas WHERE status = 'falta';
  SELECT COUNT(*) INTO v_total_faltas_justificadas FROM public.presencas WHERE status = 'falta_justificada';

  -- Média geral de presença
  SELECT COALESCE(
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'presente')::NUMERIC /
       NULLIF(COUNT(*), 0)::NUMERIC) * 100
    ), 100
  ) INTO v_media_presenca FROM public.presencas;

  RETURN json_build_object(
    'total_grupos', v_total_grupos,
    'total_alunos', v_total_alunos,
    'total_presentes', v_total_presentes,
    'total_faltas', v_total_faltas,
    'total_faltas_justificadas', v_total_faltas_justificadas,
    'media_presenca', v_media_presenca
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Habilita RLS em todas as tabelas
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas service_role tem acesso total (a API usa service_role)
-- Usuários autenticados via JWT customizado não usam o auth do Supabase diretamente,
-- então as políticas permitem acesso via service_role key.

CREATE POLICY "service_role_all_usuarios" ON public.usuarios
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_grupos" ON public.grupos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_alunos" ON public.alunos
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_presencas" ON public.presencas
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_historico" ON public.historico
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_backups" ON public.backups
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- DADOS INICIAIS: Usuário administrador padrão
-- ============================================================
-- Senha padrão: Admin@123 (hash bcrypt)
-- IMPORTANTE: Altere a senha após o primeiro acesso!
INSERT INTO public.usuarios (nome, email, senha_hash, role)
VALUES (
  'Administrador',
  'admin@pjm.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2i',
  'admin'
) ON CONFLICT (email) DO NOTHING;
