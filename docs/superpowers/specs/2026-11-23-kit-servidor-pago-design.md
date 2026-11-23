# Kit servidor pago (cópia do RAdio_06) — Design

**Data:** 2026-11-23
**Estado:** aprovado pelo utilizador (design apresentado em conversa)

## Objetivo

Preparar uma cópia completa e auto-suficiente do projeto RAdio_06 num diretório fora do repositório, pronta para mais tarde ser carregada num servidor pago (tipo VPS) e construída com `npm ci` + `npm run build`, servindo depois o `dist/`.

## Fora do alcance

- Não se altera o código do RAdio_06 (nem do 05).
- Não se escolhe nem se configura o servidor pago — o utilizador escolhe depois.
- Não se faz deploy nenhum.

## Localização

`C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago\`

Pasta irmã do `RAdio_06`, fora de qualquer repositório git (não vai para o GitHub).

## Conteúdo (cópia integral do RAdio_06, com exclusões)

**Excluir** (regenerável ou local):

- `node_modules/`
- `dist/`
- `.git/`
- `.astro/`
- `.netlify/`
- `test-results/`
- `*.log`
- `.superpowers/`
- `docs/superpowers/` (specs e plans do superpowers)

**Incluir:**

- `src/` (todo o código)
- `content/` (todo o conteúdo)
- `public/` (media + `admin/` Decap)
- `tests/`
- Configs: `package.json`, `package-lock.json`, `tsconfig.json`, `astro.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `vercel.json`, `netlify.toml`, `.gitignore`
- `README.md`
- `docs/OPERACAO.md` (runbook: URLs, admin, Identity, deploys)

## Ficheiros novos na raiz do kit

1. **`LEIAME-servidor.md`** — instruções para pôr o site num servidor pago:
   - transferir a pasta para o servidor
   - `npm ci` (ou `npm install`)
   - `npm run build` → `dist/`
   - servir `dist/` (nginx ou `npx serve`)
   - aviso: o `/admin` (Decap CMS) precisa de um backend git próprio no servidor novo (no setup atual usa Netlify Identity/Git Gateway — ver `docs/OPERACAO.md`); sem isso o login do painel não funciona
2. **`actualizar-kit.ps1`** — script que repete a cópia a partir do `RAdio_06` com as mesmas exclusões, para atualizar o instantâneo sempre que o projeto mudar

## Verificação

Dentro da pasta do kit:

```powershell
npm install
npm run build; npm run check; npm run lint; npm run test
```

Todos com exit 0 (o kit constrói sozinho).

## Critério de sucesso

- Pasta `RAdio_06-servidor-pago` existe ao lado do projeto, sem `.git` nem `node_modules`
- `LEIAME-servidor.md` e `actualizar-kit.ps1` presentes na raiz
- Gates (build/check/lint/test) verdes corridos dentro da pasta nova
- RAdio_06 e RAdio_05 sem qualquer alteração
