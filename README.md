# 🗳️ Kovalski - CRM Eleitoral

Um sistema completo de CRM (Customer Relationship Management) projetado especificamente para **Campanhas Eleitorais e Mandatos Políticos**. O sistema permite a gestão detalhada de eleitores, lideranças, formulários e geração automatizada de documentos e impressões.

## 🚀 Principais Funcionalidades

- **Gestão de Eleitores:** Cadastro completo com informações de contato, endereço, liderança responsável e "Temperatura" (probabilidade de voto).
- **Filtros Geográficos Inteligentes:** Filtre a base de contatos por Cidade, Bairro, e se o eleitor possui ou não Rua/Número cadastrado.
- **Mala Direta Avançada:**
  - Criação de modelos (templates) de cartas no próprio sistema (PDF) ou envio de arquivos base em `.docx` (Microsoft Word).
  - Substituição automática de tags (`{primeiro_nome}`, `{nome}`, `{rua}`, `{numero}`, `{bairro}`, etc).
  - Geração de arquivos unificados e **ordenados estrategicamente para logística de entrega do carteiro** (Ordem alfabética de Bairro -> Rua -> Ordem crescente de Número).
- **Dashboard Analítico:** Visão geral de métricas, metas de votos e conversão do funil de eleitores.
- **Autenticação:** Acesso seguro com separação de rotas e segurança via NextAuth.

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados:** [Prisma ORM](https://www.prisma.io/)
- **Autenticação:** [NextAuth.js](https://next-auth.js.org/)
- **Processamento de Documentos:** `pdf-lib` (para geração de PDFs) e `docxtemplater` / `pizzip` (para injeção de dados no Word).

## ⚙️ Como rodar o projeto localmente

### Pré-requisitos
- Node.js (v18+)
- Gerenciador de pacotes (npm, yarn ou pnpm)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/AgenciaSpline/Kovalski.git
   cd Kovalski
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configuração de Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto contendo suas chaves de banco de dados e autenticação:
   ```env
   DATABASE_URL="sua_url_de_conexao_aqui"
   NEXTAUTH_SECRET="sua_chave_secreta_aqui"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Sincronize o Banco de Dados**
   ```bash
   npx prisma db push
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   O sistema estará disponível em `http://localhost:3005` (ou na porta configurada).

## 🔒 Autoria
Desenvolvido e mantido para as operações da **Agência Spline / AnokSystem**.