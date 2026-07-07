# PJM — Presença Jovem Missionário

Sistema completo de controle de presença para o Jovem Missionário, desenvolvido com **Next.js 14**, **TypeScript**, **Tailwind CSS**, **shadcn/ui** e **Supabase (PostgreSQL)**.

---

## Funcionalidades

- **Login seguro** com JWT e senhas criptografadas (bcrypt)
- **Dashboard** com estatísticas e gráficos de presença
- **Grupos** — criar, editar, excluir e pesquisar
- **Alunos** — cadastro completo com foto, grupo e telefone
- **Chamada** — registro de presença (Presente / Falta / Falta Justificada)
- **Percentual de presença** com barra de progresso (verde ≥ 70%, vermelho < 70%)
- **Histórico** completo com filtros por data, grupo, aluno e status
- **Importação** de dados via JSON ou Excel (.xlsx)
- **Exportação** de dados em JSON ou Excel, em ordem alfabética
- **Backup** manual com download e restauração
- **Painel Admin** para gerenciar usuários, senhas e permissões
- **Tema claro e escuro** com alternância automática
- **Responsivo** para celular e computador

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) versão 18 ou superior
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
- Conta no [Supabase](https://supabase.com/) (gratuita)
- Conta na [Vercel](https://vercel.com/) (gratuita)

---

## 1. Como Instalar

```bash
# Clone o repositório ou extraia o arquivo ZIP
cd pjm-presenca-jovem-missionario

# Instale as dependências
npm install
# ou
pnpm install
```

---

## 2. Como Configurar o Supabase

### 2.1 Criar o Projeto

1. Acesse [supabase.com](https://supabase.com/) e faça login.
2. Clique em **"New project"**.
3. Preencha:
   - **Organization**: sua organização
   - **Name**: `pjm` (ou qualquer nome)
   - **Database Password**: crie uma senha forte e guarde-a
   - **Region**: escolha a mais próxima (ex.: `South America (São Paulo)`)
4. Aguarde o projeto ser criado (cerca de 2 minutos).

### 2.2 Obter as Chaves de API

1. No painel do Supabase, vá em **Settings → API**.
2. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Nunca exponha a `service_role` key no frontend!**

---

## 3. Como Criar o Banco de Dados

1. No painel do Supabase, vá em **SQL Editor**.
2. Clique em **"New query"**.
3. Copie todo o conteúdo do arquivo `supabase/migrations/001_schema_inicial.sql`.
4. Cole no editor e clique em **"Run"**.
5. Aguarde a execução. Você verá as tabelas criadas em **Table Editor**.

O script cria automaticamente:
- Tabelas: `usuarios`, `grupos`, `alunos`, `presencas`, `historico`, `backups`
- Índices para performance
- Triggers para atualização automática de timestamps
- Trigger para sincronizar o histórico
- Função para calcular percentual de presença
- Políticas de segurança (Row Level Security)
- **Usuário administrador padrão**: `admin@pjm.com` / `Admin@123`

---

## 4. Como Preencher o .env.local

1. Na raiz do projeto, copie o arquivo de exemplo:

```bash
cp .env.local.example .env.local
```

2. Abra `.env.local` e preencha com suas chaves:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# JWT Secret (gere uma string aleatória longa)
JWT_SECRET=sua_string_secreta_muito_longa_aqui_minimo_32_caracteres

# URL da aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Dica para gerar o JWT_SECRET:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## 5. Como Executar Localmente

```bash
# Inicia o servidor de desenvolvimento
npm run dev
# ou
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

**Credenciais padrão:**
- Email: `admin@pjm.com`
- Senha: `Admin@123`

> ⚠️ **Altere a senha após o primeiro acesso!**

---

## 6. Como Publicar na Vercel

### 6.1 Via Interface Web

1. Acesse [vercel.com](https://vercel.com/) e faça login.
2. Clique em **"New Project"**.
3. Importe seu repositório Git (GitHub, GitLab ou Bitbucket).
4. Na tela de configuração:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: deixe em branco (raiz do projeto)
5. Clique em **"Deploy"**.

### 6.2 Via CLI

```bash
# Instala a CLI da Vercel globalmente
npm install -g vercel

# Faz o deploy
vercel

# Para produção
vercel --prod
```

---

## 7. Como Conectar o Supabase à Vercel

Após o deploy, configure as variáveis de ambiente na Vercel:

1. No painel da Vercel, acesse seu projeto.
2. Vá em **Settings → Environment Variables**.
3. Adicione cada variável do `.env.local`:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production, Preview, Development |
| `JWT_SECRET` | `sua_string_secreta` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://seu-dominio.vercel.app` | Production |

4. Após adicionar todas as variáveis, clique em **"Redeploy"** para aplicar.

### 7.1 Configurar CORS no Supabase (se necessário)

1. No Supabase, vá em **Authentication → URL Configuration**.
2. Em **Site URL**, adicione a URL da sua aplicação na Vercel.
3. Em **Redirect URLs**, adicione também a URL da Vercel.

---

## 8. Como Fazer Backup e Restaurar os Dados

### Criar Backup Manual

1. No sistema, acesse **Backup** no menu lateral.
2. Clique em **"Criar Backup"**.
3. O sistema coleta todos os dados e salva no banco.
4. O arquivo JSON é baixado automaticamente.

### Baixar Backup Existente

1. Na lista de backups, clique no ícone de **download** (⬇️).
2. O arquivo JSON será baixado para o seu computador.

### Restaurar Backup

1. Na lista de backups, clique no ícone de **restaurar** (🔄).
2. Confirme a operação na caixa de diálogo.
3. O sistema restaurará grupos, alunos e presenças.

> ⚠️ **A restauração sobrescreve os dados existentes. Faça um backup antes!**

### Backup Automático (Supabase)

O Supabase oferece backups automáticos diários no plano Pro. Para configurar:

1. No Supabase, vá em **Settings → Backups**.
2. Ative os backups automáticos (disponível no plano Pro).

---

## 9. Como Importar e Exportar JSON e Excel

### Exportar Dados

1. Acesse **Exportação** no menu lateral.
2. Escolha o tipo de dado: Grupos, Alunos, Histórico ou Completo.
3. Clique em **JSON** ou **Excel** para baixar.

Os dados são sempre exportados em **ordem alfabética**.

### Importar Dados

1. Acesse **Importação** no menu lateral.
2. Selecione o tipo: **Alunos** ou **Grupos**.
3. Prepare seu arquivo no formato correto:

**Formato JSON para Alunos:**
```json
[
  {
    "nome_completo": "João Silva",
    "telefone": "(11) 99999-0001",
    "grupo_nome": "Grupo A"
  }
]
```

**Formato JSON para Grupos:**
```json
[
  {
    "nome": "Grupo A",
    "descricao": "Turma da manhã",
    "cor": "#6366f1"
  }
]
```

**Formato Excel (.xlsx):**
- Crie uma planilha com as colunas correspondentes aos campos acima.
- Salve como `.xlsx`.
- Importe normalmente.

4. Clique em **Importar** e aguarde o resultado.

> **Nota:** Ao importar alunos, se o grupo informado em `grupo_nome` não existir, ele será criado automaticamente.

---

## Estrutura do Projeto

```
pjm/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Página de login
│   │   ├── (dashboard)/           # Área autenticada
│   │   │   ├── dashboard/         # Dashboard com gráficos
│   │   │   ├── grupos/            # CRUD de grupos
│   │   │   ├── alunos/            # CRUD de alunos
│   │   │   ├── chamada/           # Registro de presença
│   │   │   ├── historico/         # Histórico com filtros
│   │   │   ├── importacao/        # Importar JSON/Excel
│   │   │   ├── exportacao/        # Exportar JSON/Excel
│   │   │   ├── backup/            # Backup e restauração
│   │   │   └── admin/             # Painel administrador
│   │   └── api/                   # API Routes (backend)
│   ├── components/
│   │   ├── ui/                    # Componentes base (shadcn/ui)
│   │   └── layout/                # Sidebar, Header, ThemeProvider
│   ├── lib/
│   │   ├── auth.ts                # JWT e sessão
│   │   ├── utils.ts               # Utilitários gerais
│   │   ├── supabase/              # Clientes Supabase
│   │   └── db/                    # Camada de dados
│   ├── types/                     # Tipos TypeScript
│   ├── styles/                    # CSS global
│   └── middleware.ts              # Proteção de rotas
├── supabase/
│   └── migrations/                # Scripts SQL
├── .env.local.example             # Exemplo de variáveis de ambiente
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## Segurança

- Senhas criptografadas com **bcrypt** (salt 12)
- Autenticação via **JWT** assinado com segredo customizado
- Cookies **httpOnly** e **secure** em produção
- **Row Level Security (RLS)** habilitado no Supabase
- Rotas protegidas via **Middleware** do Next.js
- Validação de formulários com **Zod**
- Proteção contra **SQL Injection** via ORM do Supabase
- Proteção contra **XSS** via React (escape automático)
- **CSRF** mitigado via cookies SameSite=Lax

---

## Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 14.1 | Framework React full-stack |
| TypeScript | 5.3 | Tipagem estática |
| Tailwind CSS | 3.4 | Estilização |
| Radix UI | — | Componentes acessíveis |
| Lucide React | 0.309 | Ícones |
| Recharts | 2.10 | Gráficos |
| Supabase | 2.39 | Banco de dados e storage |
| bcryptjs | 2.4 | Criptografia de senhas |
| jose | 5.2 | JWT |
| Zod | 3.22 | Validação de dados |
| React Hook Form | 7.49 | Formulários |
| xlsx | 0.18 | Importação/exportação Excel |
| next-themes | 0.2 | Tema claro/escuro |
| sonner | 1.3 | Notificações toast |
| date-fns | 3.2 | Manipulação de datas |

---

## Suporte

Em caso de dúvidas ou problemas, verifique:

1. Se todas as variáveis de ambiente estão preenchidas corretamente.
2. Se o script SQL foi executado com sucesso no Supabase.
3. Se as políticas RLS estão configuradas corretamente.
4. Os logs do console do navegador e do servidor Next.js.

---

*PJM — Presença Jovem Missionário © 2024. Desenvolvido com ❤️ para o ministério.*
"# pjmv1" 
