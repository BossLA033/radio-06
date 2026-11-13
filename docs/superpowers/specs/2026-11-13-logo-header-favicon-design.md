# Logo no header + favicon — Rádio 06 Design Spec

**Data:** 2026-11-13
**Estado:** Aprovado pelo utilizador (design em secções, 2026-11-13)

## Objectivo

Substituir o wordmark de texto do header do Rádio 06 pela imagem original do logotipo (fundo transparente, com "90.3 FM" embutido) e adicionar favicon ao site — que hoje não tem nenhum. Footer mantém o wordmark em texto.

## Escopo

- **Incluído:** assets copiados para `public/`, `<img>` no header, `<link rel="icon">` + apple-touch-icon no `Base.astro`, manifest mínimo, verificação gates + deploy.
- **Excluído:** footer (mantém texto), logo configurável pelo admin (abordagem B rejeitada), qualquer alteração de cores/tema/secções.

## Decisões tomadas

| Questão | Resposta |
|---|---|
| O que é "logotipo original"? | Imagem no header (não só favicon) |
| Qual ficheiro? | `logo_radio_x_transparent.png` (horizontal, transparente, com frequência) |
| Frequência em texto separado? | Não — o logo já a inclui |
| Footer? | Não muda |
| Âmbito extra? | favicon incluído |
| Abordagem | **A** — assets estáticos directos (não configurável pelo admin) |

## Secção 1: Assets

Copiar (sem criar arte nova) para o repo `RAdio_06`:

| Origem (absoluta sob `C:\Users\breno\Documents\Antigraviti_texte\`) | Destino |
|---|---|
| `Site_radio_X\radio-x-903\images\logo\logo_radio_x_transparent.png` | `public/logo/logo_radio_x_transparent.png` |
| `Site_radio_X\radio-x-v3\src\app\favicon.ico` | `public/favicon.ico` |
| `Site_radio_X\radio-x-903\images\logo\favicon-32.png` | `public/favicon-32.png` |
| `Site_radio_X\radio-x-903\images\logo\favicon-64.png` | `public/favicon-64.png` |
| `Site_radio_X\radio-x-903\images\logo\icon-192.png` | `public/icon-192.png` |
| `Site_radio_X\radio-x-903\images\logo\icon-512.png` | `public/icon-512.png` |

Criar `public/site.webmanifest`:

```json
{
  "name": "Rádio X 90.3 FM",
  "short_name": "Rádio X",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0a0a0a",
  "background_color": "#0a0a0a",
  "display": "standalone"
}
```

## Secção 2: Header

Ficheiro: `src/components/Header.astro`

Actual:

```astro
<a href="/" class="flex flex-col" aria-label={`${d.nome} — página inicial`}>
  <span class="wordmark">{d.nome}</span>
  <span class="freq">{d.frequencia}</span>
</a>
```

Novo:

```astro
<a href="/" aria-label={`${d.nome} — página inicial`}>
  <img
    src="/logo/logo_radio_x_transparent.png"
    alt={d.nome}
    width="180"
    height="48"
    class="h-10 w-auto md:h-11"
  />
</a>
```

- Remove os spans `wordmark`/`freq` **apenas do header**; as classes CSS `.wordmark` e `.freq` mantêm-se (footer e outros usos).
- `width`/`height` declarados no `<img>` para prevenir layout shift.
- Altura 40px (mobile) / 44px (desktop ≥ md), largura automática.
- `alt` = `d.nome` (vem de `definicoes()`).

## Secção 3: Favicon

Ficheiro: `src/layouts/Base.astro` — acrescentar no `<head>`, antes de `<title>`:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32" />
<link rel="icon" type="image/png" href="/favicon-64.png" sizes="64x64" />
<link rel="apple-touch-icon" href="/icon-192.png" />
<link rel="manifest" href="/site.webmanifest" />
```

## Secção 4: Verificação

1. Gates: `npm run build`, `npm run check`, `npm run lint`, `npm run test` → exit 0 (em `RAdio_06`).
2. `dist/index.html` contém: `<img ... logo_radio_x_transparent.png` no header; `rel="icon"` e `rel="manifest"` no `<head>`.
3. Ficheiros presentes em `dist/`: `favicon.ico`, `favicon-32.png`, `favicon-64.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `logo/logo_radio_x_transparent.png`.
4. Commit + push → Vercel deploy automático → verificar em `https://radio-06.vercel.app` (logo visível, favicon carrega).

## Fora do âmbito

- Footer (wordmark de texto mantido).
- Substituição do logo via admin Decap.
- Favicon no Rádio 05 (intocado).
- Alterações de tema/cores.
