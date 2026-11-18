# Spec: Carrosséis com autoplay na homepage do radio-06 (Destaques + Notícias)

- **Data:** 2026-11-18 (revista; original 2026-11-16)
- **Estado:** aprovado pelo utilizador (âmbito B + conteúdo A + intervalos 5000/4000)
- **Projecto:** RAdio_06 — Astro 5 + Tailwind 4, zero dependências de runtime
- **Âmbito:** homepage (`src/pages/index.astro`), `content/home/destaques.json` e `content/noticias/`

## Contexto

O site está bom, mas a homepage carece de dinamismo: a secção DESTAQUES (variante `carrossel`) é um `ul` com scroll horizontal manual, sem setas nem autoplay, e a secção NOTÍCIAS é uma grelha fixa de 4 colunas, estática. O pedido do utilizador — "colocar carrossel nos destaques e notícias" — encaixa exactamente nestas duas secções.

A implementação provada no projecto irmão RAdio_05 (spec `2026-11-16-carrosseis-home-design.md`, 21 testes + smoke verde, publicada em produção) será portada para o 06, evitando re-resolver problemas já resolvidos (wrap, tolerância de sub-pixels, pausa, lifecycle com View Transitions).

**Problema de dimensionamento detectado e resolvido:** só existem 4 itens em cada secção-alvo (Destaques ≈1082px; Notícias 4 cartões numa grelha), mas o wrap da homepage tem até ~1352px — em desktop **cabe tudo** e não há nada para deslizar. Decisão do utilizador: **criar conteúdo novo até transbordar** (opção A, confirmada).

## Decisões do utilizador

| Questão | Decisão |
|---|---|
| Secções com movimento | **B)** Destaques + Notícias (a faixa de programas do topo fica como está) |
| Conteúdo para transbordar | **A)** Criar conteúdo novo (destaques novos + notícias novas) até transbordar |
| Intervalos | Destaques **5000 ms**, Notícias **4000 ms** |
| Setas | **Autoplay + setas ‹ › nas duas**, pausa no hover/foco |
| Alterações no RAdio_05 | **Manter** (05 fica como está, publicado) |
| Abordagem | **Opção 1:** portar a implementação provada do 05 (`lib/carrossel.ts` + reescrita do `Carrossel.astro`) |

## Conteúdo a criar (garante transbordo)

Regra: o conteúdo precisa de transbordar o wrap (~1352px) **e** deixar ≥2 posições de scroll alcançáveis (`maximo ≥ primeiro offset`).

### `content/home/destaques.json` — 3 novos itens (total 7)

Schema: `titulo`, `resumo`, `tag`, `imagem`, `href`.

1. **"Festival Verão Luanda começa a contar"** · tag `Eventos` · `/media/noticia-1.svg` · href `/noticias/festival-verao-luanda/`
2. **"Sábado com programação renovada"** · tag `Programação` · `/media/noticia-2.svg` · href `/programas/sabado-x/`
3. **"Nova linha de podcasts no ar"** · tag `Podcasts` · `/media/noticia-3.svg` · href `/podcasts/`

- Verificação: 7 × 260px + 6 × 14px = **1904px > 1352px** ✓ (`maximo` = 552 ≥ offset[1] = 274 → 3 posições).

### `content/noticias/` — 3 novos `.md` (total 7; a secção passa a `slice(0, 7)`)

Schema (igual aos existentes, `public/admin/config.yml` coleção `noticias`): `titulo`, `data` (YYYY-MM-DD), `tag` (select: Música, Entrevistas, Eventos, Programação, Comunidade, Institucional), `resumo`, `capa`, `rascunho: false`.

| ficheiro | titulo | data | tag | capa |
|---|---|---|---|---|
| `noite-acustica-kilamba.md` | Noite Acústica no Kilamba completa cartaz | 2026-10-15 | Eventos | `/media/001.webp` |
| `radio-x-chega-ao-kilamba.md` | Rádio X amplia o sinal para o Kilamba | 2026-10-12 | Institucional | `/media/784981923_1092628363282732_2773791522913315368_n.jpg` |
| `sabores-em-conversa.md` | Sabores angolanos em conversa na Tarde X | 2026-10-05 | Entrevistas | `/media/sabor-angolano.webp` |

- Capas: só media já existente em `public/media/` (nenhum ficheiro novo de imagem).
- Itens da faixa: 7 notícias + 1 patrocinador = 8 × 300px + 7 × 14px = **2498px > 1352px** ✓ (`maximo` = 1146 ≥ offset[1] = 314 → ≥3 posições).
- Mesmo sem patrocinador: 7 × 300px + 6 × 14px = 2184px > 1352px ✓.

## Requisitos funcionais

1. **Secção DESTAQUES** (`DestaquesSecao` variante `carrossel`, `index.astro:27`): autoplay **5000 ms** + setas ‹ ›, pausa no hover/foco/toque. Variante `grelha` ("EM DESTAQUE") **intocada visualmente** — passa a mostrar `itens.slice(0, 4)` (hoje são 4, logo idêntico).
2. **Secção NOTÍCIAS** (`NoticiasSecao`, `index.astro:19`): de grelha fixa passa a carrossel horizontal com autoplay **4000 ms** + setas ‹ ›, pausa no hover/foco/toque; `slice(0, 3)` → `slice(0, 7)`; o cartão do patrocinador continua a ser o último item da faixa.
3. **Intocados:** faixa de programas do topo, grelha "EM DESTAQUE", tira de programas, podcasts, passou, vídeos, homenagens, TOP X, concertos, equipa e resto. Os 4 usos existentes do `Carrossel.astro` (tira, podcasts, passou, vídeos) **continuam sem autoplay** — não recebem `auto` (mantêm setas manuais).
4. **`prefers-reduced-motion: reduce`:** autoplay desligado; setas funcionam com scroll instantâneo (`behavior: 'auto'`).
5. **View Transitions (`ClientRouter`):** init em `astro:page-load`; timers limpos em `astro:before-swap` (nada de duplo autoplay após navegação).
6. **Acessibilidade:** botões com `aria-label` (`"{rotulo} anterior"` / `"{rotulo} seguinte"`); wrapper com `role="group"`, `aria-roledescription="carrossel"`, `aria-label={rotulo}`; autoplay pausa em `focusin`/`pointerenter` e retoma em `focusout`/`pointerleave` (fora dos botões); utilizador nunca perde o controlo (`pointerdown` cancela). Sem `aria-live` na faixa (evita anúncios repetidos de leitor de ecrã durante o autoplay).

## Arquitectura

### `src/lib/carrossel.ts` (novo — port exacto do 05)

```ts
export interface Passo { esquerda: number; salto: boolean }
export function proximoOffset(offsets: number[], scrollLeft: number, maximo: number): Passo;
export function offsetAnterior(offsets: number[], scrollLeft: number, maximo: number): Passo;
```

- `offsets` = `offsetLeft` de cada filho; `indiceActual` compara com `scrollLeft + 1` (tolerância a sub-pixels).
- Avançar: item seguinte; se não existe ou passa do `maximo` → volta a `offsets[0]` com `salto: true`.
- Recuar: item anterior; no início → último offset `≤ maximo` com `salto: true`.

### `src/lib/carrossel.test.ts` (novo — 9 testes portados do 05)

`proximoOffset`: avança; wrap no fim; wrap quando o próximo ultrapassa o fim visível; tolerância 619.5→620; sem itens → origem.
`offsetAnterior`: recua; wrap do início para o último visível; de um fim clamped recua ao estado lógico; sem itens → origem.

### `src/components/Carrossel.astro` (reescrito)

```astro
interface Props {
  id?: string;
  auto?: boolean;      // default false — os 4 usos existentes não mudam
  setas?: boolean;     // default true  — setas mantêm-se em todos
  intervalo?: number;  // default 4000
  rotulo?: string;     // default 'Carrossel' — base dos aria-label
}
```

- Markup: wrapper `div.relative` (`data-carrossel`, `data-auto?`, `data-setas?`, `data-intervalo`, `id?`, `role="group"`, `aria-roledescription="carrossel"`, `aria-label`) → `ul.car.snap-x.snap-mandatory[data-faixa][tabindex=0]` com slot → botões `button.arrow.l` / `button.arrow.r` (`data-seta-anterior` / `data-seta-seguinte`) só quando `setas`.
- CSS: reaproveita `.car`/`.arrow` de `globals.css`; estilos globais no componente: filhos com `scroll-snap-align: start`; `[data-sem-movimento]` esconde as setas.
- **`globals.css`:** remover `scroll-behavior: smooth` de `.car` (linha 128) — o comportamento passa a ser ditado pelo JS (`scrollTo({ behavior })`), para que `prefers-reduced-motion` consiga scroll instantâneo.
- Script: port do 05 (prova aprovada) — offsets, wrap, autoplay com timer único por instância, pausa `pointerenter`/`pointerleave`/`focusin`/`focusout` (retoma fora dos botões), `pointerdown` cancela, `visibilitychange`/`resize` reavaliam, `data-sem-movimento` quando `cabeTudo`, teclado ←/→, `astro:page-load` init + `astro:before-swap` limpa timers. `setas` ausente → sem botões; `auto` ausente → sem timer.

### Integração

- **`DestaquesSecao.astro`:**
  - variante `carrossel`: import de `Carrossel`; o `ul` bruto passa a `<Carrossel id="destaquesCar" auto setas intervalo={5000} rotulo="Destaques">` (filhos `li.item` com `style="flex:0 0 260px"` mantêm-se); `itens` passa a `itens` completo (7).
  - variante `grelha`: `itens` → `itens.slice(0, 4)` para não alterar a grelha "EM DESTAQUE" com o conteúdo novo.
- **`NoticiasSecao.astro`:** import de `Carrossel`; `slice(0, 3)` → `slice(0, 7)`; o `ul.news-grid` passa a `<Carrossel id="noticiasCar" auto setas intervalo={4000} rotulo="Notícias">`; cada `li.item` ganha `style="flex:0 0 300px"`; o `li.sponsor` mantém-se como último item, também com `style="flex:0 0 300px"`.
- **`ProgramasSecao.astro` (variante `tira`) e `PassouSecao.astro`:** só os `<div class="item">` filhos passam a `<li class="item">` (HTML válido sob `ul`); props não mudam.
- **`PodcastsSecao.astro` / `VideosSecao.astro`:** sem alterações (já usam `li`).

## Testes & gates

| Tipo | Conteúdo |
|---|---|
| Unit (vitest) | 9 testes portados — `npm run test` |
| Smoke (Playwright) | **4 novos:** (1) homepage tem exactamente 2 `[data-carrossel][data-auto]`, com `data-intervalo="5000"` (Destaques) e `"4000"` (Notícias); (2) `scrollLeft` da faixa dos Destaques avança sozinho em ≤6 s; (3) idem Notícias em ≤5 s; (4) hover pausa + clique em "Destaques seguinte" aumenta `scrollLeft`. Existentes (16) continuam verdes → total **20**. |
| Gates | `npm run check` · `npm run lint` · `npm run test` · `npm run build` · `npm run smoke` |
| Deploy | push a `main` → CD Vercel existente; confirmar produção |

## Fora de âmbito

- Faixa de programas do topo (opção B excluiu-a); grelha "EM DESTAQUE"; autoplay nas outras 4 secções com carrossel; `content/programas/` e `content/grelha.json`; alterações no RAdio_05; Embla ou outras libs.

## Critérios de aceitação

1. Homepage do 06: DESTAQUES (7 cards, 5 s) e NOTÍCIAS (8 itens, 4 s) deslizam sozinhas **em desktop e em telemóvel**, com setas e pausa no hover/foco.
2. Grelha "EM DESTAQUE" continua a mostrar os mesmos 4 itens de hoje.
3. As 4 secções existentes com carrossel mantêm setas manuais e **sem** autoplay.
4. `prefers-reduced-motion` respeitado (sem autoplay; setas instantâneas).
5. Navegação com View Transitions não duplica nem mata os timers.
6. `/noticias/` lista 7 notícias e as 7 páginas `[slug]` renderizam 200.
7. Todos os gates verdes; smoke = 16 + 4 = 20.
