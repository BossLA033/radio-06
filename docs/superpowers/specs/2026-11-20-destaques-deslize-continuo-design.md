# Spec: Deslize contínuo nos Destaques (marquee) — radio-06

- **Data:** 2026-11-20
- **Estado:** aprovado pelo utilizador (deslize contínuo lento, só Destaques, setas que pausam)
- **Projecto:** RAdio_06 — Astro 5 + Tailwind 4, zero dependências de runtime
- **Âmbito:** `src/components/Carrossel.astro`, `src/components/DestaquesSecao.astro`, `tests/smoke.spec.ts`

## Contexto

A secção DESTAQUES da homepage usa já o `Carrossel` com autoplay por saltos (5000 ms): os cards param entre saltos. O pedido do utilizador — "quero um carrossel que está sempre em movimento" — exige animação permanente: um **deslize contínuo** (estilo ticker/marquee) que nunca fica parado enquanto o rato não está em cima.

## Decisões do utilizador

| Questão | Decisão |
|---|---|
| Tipo de movimento | **Deslize contínuo** em loop infinito (não saltos) |
| Âmbito | **Só os Destaques** — Notícias mantém o salto automático de 4000 ms |
| Setas ‹ › | **Mantidas**; clicar pára a deriva, move para o card e a deriva retoma ao sair do hover |
| Velocidade | **Lenta ~30 px/s** (legível) |
| Hover/foco/toque | **Pausa** a deriva (como hoje) |
| Alterações noutras secções | **Nenhuma** (notícias, podcasts, vídeos, passou, tira ficam como estão) |

## Abordagem escolhida

**Deriva contínuo em JS sobre `scrollLeft` + clonagem `aria-hidden`** (opção B do design). Rejeitada a animação CSS com `transform` (perde swipe nativo no telemóvel e complica as setas).

Loop invisível: no init, o JS clona uma cópia dos cards reais (com `aria-hidden="true"`), mede a largura do original (`ciclo`); um `requestAnimationFrame` soma `velocidade · dt` a `scrollLeft` e, quando `scrollLeft ≥ ciclo`, subtrai `ciclo` — a emenda é indistinguível porque a cópia é idêntica.

## Requisitos funcionais

1. **Props novas** em `Carrossel.astro`:
   - `deslize?: boolean` (default `false`) — deriva contínua; atributo `data-deslize` no wrapper.
   - `velocidade?: number` (default `30`, px/s) — atributo `data-velocidade`.
   - Props existentes (`id`, `auto`, `setas`, `intervalo`, `rotulo`) mantêm o comportamento actual; `deslize` e `auto` são modos alternativos (se ambos, `deslize` ganha).
2. **DestaquesSecao** (variante `carrossel`): `<Carrossel id="destaquesCar" deslize velocidade={30} setas rotulo="Destaques">` — perde `auto intervalo={5000}`.
3. **Deriva:** rAF escreve `scrollLeft` a ~30 px/s; wrap `scrollLeft -= ciclo` ao alcançar o início da cópia. `dt` com clamp (máx. 100 ms por frame, pula frames em abas ocultas).
4. **Clonagem:** apenas uma vez por init; clones com `aria-hidden="true"` e `tabindex="-1"` (leitores de ecrã e tabulação ignoram); contam para o `scrollWidth`, não para a lógica de conteúdo.
5. **Pausa/retoma:** `pointerenter`/`focusin`/`pointerdown`/`document.hidden` pausam a deriva; `pointerleave`/`focusout`/`pointerup` retomam (se `data-deslize` e sem `prefers-reduced-motion`). Setas: clicar move com `proximoOffset`/`offsetAnterior` existentes e não retoma até sair do hover.
6. **`prefers-reduced-motion: reduce`:** sem deriva; setas com `behavior: 'auto'`.
7. **`cabeTudo`:** considera só os cards **reais** (filhos sem `aria-hidden`) — 0 ou 1 → `data-sem-movimento` (esconde setas) e sem deriva. Com clones, o `maximo` passa a ser sempre > 0, por isso a contagem real é o guard.
8. **Teclado:** ←/→ na faixa movem para o card lógico seguinte/anterior (como hoje).
9. **Navegação View Transitions:** init em `astro:page-load`, cancelamento do rAF em `astro:before-swap` (como os timers actuais).
10. **Intocados:** variante `grelha` dos destaques, Notícias (`auto` 4000), restantes 4 secções com `Carrossel`, conteúdo.

## Testes & gates

| Tipo | Conteúdo |
|---|---|
| Unit (vitest) | **Sem alterações e sem testes novos** — o wrap da deriva (`scrollLeft -= ciclo`) vive no script do componente, sem função nova na lib; o comportamento é coberto pelo smoke |
| Smoke (Playwright) | **1 novo:** `scrollLeft` dos Destaques muda em ≤2 s (deriva contínua, não salto de 5 s). Os 20 actuais continuam verdes (o teste "avançam sozinhos" e "hover pausa + seta" mantêm-se válidos) → total **21** |
| Gates | `npm run check` · `npm run lint` · `npm run test` · `npm run build` · `npm run smoke` |
| Deploy | push a `main` → CD Vercel existente; confirmar produção |

## Fora de âmbito

- Deslize contínuo nas outras secções; mudanças na Notícias; bibliotecas externas (Embla/Swiper); alterações ao RAdio_05; `prefers-reduced-motion` com deriva.

## Critérios de aceitação

1. Destaques na homepage desliza continuamente a ~30 px/s, em loop invisível, em desktop e telemóvel.
2. Hover/foco/toque pára a deriva; sair retoma.
3. Setas movem para o card seguinte/anterior e a deriva retoma depois de sair do hover.
4. `prefers-reduced-motion` → sem deriva, setas instantâneas.
5. Conteúdo com 0-1 cards reais → sem movimento e sem setas.
6. Notícias e as outras 4 secções com carrossel inalteradas (salto 4000 ms / setas manuais).
7. Todos os gates verdes; smoke = 20 + 1 = 21.
