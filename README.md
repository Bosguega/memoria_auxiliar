# Memoria Auxiliar

Aplicativo desktop simples com Tauri, Vue 3, TypeScript e SQLite para salvar notas curtas e buscar por similaridade semantica usando embeddings do Gemini.

## Requisitos

- Node.js
- Rust/Cargo
- Chave da Gemini API

## Configuracao

```bash
npm install
cp .env.example .env
```

Edite `.env` e preencha:

```bash
VITE_GEMINI_API_KEY=sua_chave
```

## Rodar em desenvolvimento

```bash
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

## Arquitetura

- `src/views/HomeView.vue`: tela unica do MVP.
- `src/components`: formulario de nota, busca e lista de resultados.
- `src/services/databaseService.ts`: acesso ao SQLite via comandos Tauri.
- `src/services/embeddingService.ts`: embeddings Gemini com cache por hash SHA-256.
- `src/services/similarityService.ts`: similaridade de cosseno em TypeScript.
- `src/services/llmService.ts`: resumo opcional com Gemini Flash Lite.
- `src-tauri/src/lib.rs`: comandos Rust e inicializacao do SQLite local.

## Banco

Tabela principal:

```sql
notes (
  id INTEGER PRIMARY KEY,
  content TEXT NOT NULL,
  embedding TEXT NOT NULL,
  created_at TEXT
)
```

O app tambem cria `embedding_cache` para evitar chamadas repetidas de embedding para textos iguais.
