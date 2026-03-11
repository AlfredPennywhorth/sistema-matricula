# Sistema de Matrículas — Colégio Conquista

App web para **gestão de alunos e acompanhamento de matrículas** do Colégio Conquista.

## Tecnologias

- **React 19** + Vite
- **TailwindCSS 3**
- **Recharts** (gráficos)
- **Lucide React** (ícones)
- Persistência local via **localStorage**

## Funcionalidades

- 📊 **Dashboard** — KPIs de matrículas, gráfico de ocupação de salas e linha do tempo
- 📝 **Nova Matrícula** — Cadastro completo com vínculo familiar e bolsa automática para irmãos
- 👥 **Lista de Alunos** — Busca por nome, RA ou turma, edição e exclusão
- 🎂 **Aniversariantes** — Listagem dos alunos aniversariantes do mês
- 📥 **Importar Planilha** — Importação de alunos via arquivo CSV
- ⚙️ **Configurações** — Ajuste de capacidade de cada turma (persistido)

## Como rodar localmente

```bash
cd app
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## Estrutura do Projeto

```
sistema_matriculas/
├── app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FormularioMatricula.jsx
│   │   │   ├── ImportadorAlunos.jsx
│   │   │   ├── Aniversariantes.jsx
│   │   │   └── Configuracoes.jsx
│   │   ├── data/
│   │   │   └── db.js          # Tabelas de turmas, status, etc.
│   │   └── App.jsx
│   └── public/
│       └── logo.png
└── Alunos_Importacao.csv      # Modelo de importação
```
