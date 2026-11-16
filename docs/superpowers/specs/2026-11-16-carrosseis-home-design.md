# Spec: Carrosséis com autoplay na homepage do radio-06

- **Data:** 2026-11-16
- **Estado:** aprovado pelo utilizador (design apresentado e aprovado; decisão "sim")
- **Projecto:** RAdio_06 — Astro 5 + Tailwind 4, zero dependências de runtime
- **Âmbito:** apenas a homepage (`src/pages/index.astro`)

## Contexto

O site está bom, mas a homepage carece de dinamismo: a faixa de programas no topo e a secção DESTAQUES são listas com scroll horizontal manual, sem autoplay e sem setas. O pedido original — "os programas em cima em espécie de carrossel" e "nos destaques colocar movimentar" — encaixa exactamente nestas duas secções do radio-06.

A implementação provada no projecto irmão RAdio_05 (spec `2026-11-16-carrosseis-home-design.md`, 21 testes + smoke verde, aprovada e publicada) será portada para o 06, evitando re-resolver problemas já resolvidos (wrap, tolerância de arredondamento, pausa, lifecycle com View Transitions).

## Decisões do utilizador

| Questão | Decisão |
|---|---|
| Secções com movimento automático | **A)** Só a faixa de programas em cima + secção DESTAQUES |
| Setas | **Autoplay + setas ‹ › nas duas**, pausa no hover |
| Alterações feitas por engano no RAdio_05 | **Manter** (05 fica como está, publicado) |
| Abordagem | **Opção 1:** portar a implementação provada do 05 (`lib/carrossel.ts` + reescrita do `Carrossel.astro`) |

## Requisitos funcionais

1. **Faixa de programas em cima** (`ProgramasSecao` variante `faixa`, `index.astro:17`):
   - autoplay a cada **4000 ms**, setas ‹ ›, pausa no hover/foco.
2. **Secção DESTAQUES** (`DestaquesSecao` variante `carrossel`, `index.astro:27`):
   - autoplay a cada **5000 ms**, setas ‹ ›, pausa no hover/foco.
3. **Intocados:** grelha "EM DESTAQUE" do topo, tira de programas, podcasts, passou, vídeos e todas as restantes secções. Os 4 usos existentes do `Carrossel.astro` (tira, podcasts, passou, vídeos) **continuam sem autoplay** — não recebem a nova prop.
4. **`prefers-reduced-motion: reduce`:** autoplay desligado, setas em `scroll-behavior: auto`, `data-sem-movimento` no `<body>`.
5. **View Transitions (`ClientRouter`):** init em `astro:page-load`; timers limpos em `astro:before-swap` (nada de duplo autoplay após navegação).
6. **Acessibilidade:** `aria-live="polite"` no track; botões sempre com `aria-label`; autoplay pausa em `focusin` e retoma em `focusout` (fora dos botões); utilizador nunca perde o controlo (hover/pointerdown cancelam o timer).

## Não-funcionais

- Zero novas dependências (vanilla JS + CSS já existente).
- Pausa = **retomar do ponto exacto** (não reiniciar o ciclo).
- Passo proporcional = **30% da largura do track**, com tolerância de 1px; wrap circular nas duas direcções.
- Sem `setInterval` crónico: cada passo agenda o próximo via `setTimeout` (um único timer por instância).

## Arquitectura

### `src/lib/carrossel.ts` (novo — port do 05)

```ts
export interface Passo {
  dir: 1 | -1;
  larguraFaixa: number;
  larguraItem: number;
  gap: number;
  restantes: number;
  actual: number;
  maximo: number;
}
export function proximoOffset(p: Passo): number;  // 0 se restantes === 0
export function offsetAnterior(p: Passo): number; // wrap circular
```

Regras: `passo = larguraFaixa * 0.3`; alvo arredondado a `Math.round`; `maximo = total - larguraFaixa`; wrap quando `alvo > maximo` (→ 0) ou `< 0` (→ maximo); guarda `|actual - maximo| <= 1` → fim; `|actual| <= 1` → início.

### `src/lib/carrossel.test.ts` (novo — 9 testes portados)

1 item em ambos os sentidos; wrap nas duas direcções com vários itens; sentidos opostos; arredondamento do scroll; tolerância de 1px no fim; item mais largo que a faixa.

### `src/components/Carrossel.astro` (reescrito)

API:

```astro
interface Props { id: string; intervalo?: number }
```

- Renderiza `<ul class="faixa scroll-snap-x scroll-smooth [scrollbar-width:none]">` com o slot + `aria-live="polite"`; mantém o wrapper `relative` + botões ‹ › (`class="arrow l|r"`) já existentes no CSS (`globals.css:171-191`).
- **Sem `intervalo` → comportamento manual exactamente como hoje** (setas activas, sem timer). Com `intervalo` → autoplay ligado.
- Setas em ambos os casos: passo proporcional com wrap via `proximoOffset`/`offsetAnterior` (substitui o `scrollBy(600)` fixo — melhoria uniforme para os 6 usos).
- Estado por instância em `WeakMap<Element, { activo, escondido, aTocar, timer, inst }>`; atributos no DOM: `data-intervalo`, `data-sem-movimento`, `data-pausado`.
- Handlers: `pointerdown`/`touchstart` (cancela), `pointerenter`/`pointerleave` (pausa/retoma), `focusin`/`focusout` (pausa/retoma fora dos botões), `scroll` (detecta `data-sem-movimento` → `actualizarPausa`).
- Lifecycle: `document.addEventListener('astro:page-load', ligar)` e `astro:before-swap` (limpa todos os timers).

## Testes & gates

| Tipo | Conteúdo |
|---|---|
| Unit (vitest) | 9 testes portados — `npm run test` |
| Smoke (Playwright) | 2 novos: após carregar a homepage, `scrollLeft` de `#programas` avança sozinho dentro de 4 s e de `#destaques` dentro de 5 s; asserts de `data-intervalo` (4000/5000). Existentes do 06 continuam verdes. |
| Gates | `npm run check` · `npm run lint` · `npm run test` · `npm run build` · `npm run smoke` |

## Fora de âmbito

- Qualquer alteração fora da homepage; alterações na grelha "EM DESTAQUE"; autoplay nas outras 4 secções com carrossel; Embla ou outra lib; alterações no RAdio_05.

## Critérios de aceitação

1. Homepage do 06: faixa de programas e DESTAQUES deslizam sozinhas (4 s / 5 s), com setas e pausa no hover.
2. `prefers-reduced-motion` respeitado (sem autoplay).
3. Navegação com View Transitions não duplica nem mata os timers.
4. As 4 secções existentes com carrossel mantêm o comportamento actual (setas manuais — passo agora proporcional em vez de 600px fixo — e **sem autoplay**).
5. Todos os gates verdes; smoke = 6 existentes + 2 novos (8).
