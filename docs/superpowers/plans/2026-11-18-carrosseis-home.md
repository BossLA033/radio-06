# Carrosséis da Homepage (Destaques + Notícias) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar as secções DESTAQUES (carrossel, 5000 ms) e NOTÍCIAS (carrossel, 4000 ms) da homepage do radio-06 em carrosséis com autoplay + setas, criando conteúdo até transbordar, portando a implementação provada no RAdio_05.

**Architecture:** Port exacto de `src/lib/carrossel.ts` (lógica pura testada) + reescrita de `src/components/Carrossel.astro` (wrapper `data-carrossel`, faixa `ul.car`, setas `.arrow` do mockup, script com autoplay/pausa/lifecycle View Transitions). Integração por slot nas duas secções; as 4 secções existentes continuam com setas manuais e sem autoplay. Conteúdo novo em `content/home/destaques.json` (+3) e `content/noticias/` (+3) garante transbordo do wrap (~1352px).

**Tech Stack:** Astro 5 (ClientRouter → `astro:page-load`/`astro:before-swap`), Tailwind 4, Vitest, Playwright (`npm run smoke`), zero dependências novas.

**Spec:** `docs/superpowers/specs/2026-11-16-carrosseis-home-design.md`

## Global Constraints

- **Zero dependências novas** (nem dev).
- Intervalos: **Destaques 5000 ms**, **Notícias 4000 ms**; os 4 usos existentes do `Carrossel` ficam **sem `auto`** (setas manuais).
- `prefers-reduced-motion: reduce` → sem autoplay; setas com `behavior: 'auto'`.
- Rótulos/`aria-label` em português; sem `aria-live` na faixa.
- `RAdio_05` intocado. Commits `feat:`/`docs:`/`chore:` **sem acentos**.
- Gates obrigatórios antes de cada commit: `npm run check`, `npm run lint`, `npm run test`, `npm run build` → exit 0; **`npm run build` antes de `npm run smoke`**.
- Só estes ficheiros mudam: `src/lib/carrossel.ts` + `carrossel.test.ts` (novos), `src/components/Carrossel.astro`, `src/styles/globals.css` (1 linha), `content/home/destaques.json`, `content/noticias/*.md` (3 novos), `src/components/DestaquesSecao.astro`, `src/components/NoticiasSecao.astro`, `src/components/ProgramasSecao.astro` (tira), `src/components/PassouSecao.astro`, `tests/smoke.spec.ts`.
- Shell PowerShell 5.1: sem `&&`.

---

### Task 1: Lógica pura do carrossel (TDD, port do 05)

**Files:**
- Create: `src/lib/carrossel.ts`
- Test: `src/lib/carrossel.test.ts`

**Interfaces:**
- Consumes: nada (código puro).
- Produces: `interface Passo { esquerda: number; salto: boolean }`; `proximoOffset(offsets: number[], scrollLeft: number, maximo: number): Passo`; `offsetAnterior(offsets: number[], scrollLeft: number, maximo: number): Passo`. A Task 2 consome as três.

- [ ] **Step 1: Escrever o teste a falhar**

Crie `src/lib/carrossel.test.ts` (9 testes, port exacto do 05):

```ts
import { describe, expect, it } from 'vitest';
import { offsetAnterior, proximoOffset } from './carrossel';

const OFFSETS = [0, 620, 1240, 1860];

describe('proximoOffset', () => {
  it('avança para o item seguinte', () => {
    expect(proximoOffset(OFFSETS, 0, 1240)).toEqual({ esquerda: 620, salto: false });
    expect(proximoOffset(OFFSETS, 620, 1240)).toEqual({ esquerda: 1240, salto: false });
  });

  it('no fim da faixa volta ao início com salto instantâneo', () => {
    expect(proximoOffset(OFFSETS, 1240, 1240)).toEqual({ esquerda: 0, salto: true });
    expect(proximoOffset(OFFSETS, 1860, 1860)).toEqual({ esquerda: 0, salto: true });
  });

  it('quando o próximo item passa do fim da faixa visível, volta ao início', () => {
    expect(proximoOffset([0, 584, 1168, 1752], 1168, 1192)).toEqual({
      esquerda: 0,
      salto: true,
    });
  });

  it('tolera sub-pixels: 619.5 considera alcançado o item em 620', () => {
    expect(proximoOffset(OFFSETS, 619.5, 1240)).toEqual({ esquerda: 1240, salto: false });
  });

  it('sem itens devolve a origem', () => {
    expect(proximoOffset([], 0, 0)).toEqual({ esquerda: 0, salto: true });
  });
});

describe('offsetAnterior', () => {
  it('recua para o item anterior', () => {
    expect(offsetAnterior(OFFSETS, 1240, 1240)).toEqual({ esquerda: 620, salto: false });
    expect(offsetAnterior(OFFSETS, 620, 1240)).toEqual({ esquerda: 0, salto: false });
  });

  it('no início salta para o último estado visível', () => {
    expect(offsetAnterior(OFFSETS, 0, 1240)).toEqual({ esquerda: 1240, salto: true });
  });

  it('de um fim clamped recua para o estado lógico anterior', () => {
    expect(offsetAnterior([0, 584, 1168, 1752], 1192, 1192)).toEqual({
      esquerda: 584,
      salto: false,
    });
  });

  it('sem itens devolve a origem', () => {
    expect(offsetAnterior([], 0, 0)).toEqual({ esquerda: 0, salto: true });
  });
});
```

- [ ] **Step 2: Correr o teste para confirmar que falha**

Run: `npm run test`
Expected: FAIL — `Cannot find module './carrossel'` (ou equivalente) em `carrossel.test.ts`; `agora.test.ts` continua a passar.

- [ ] **Step 3: Escrever a implementação mínima**

Crie `src/lib/carrossel.ts` (port exacto do 05):

```ts
export interface Passo {
  esquerda: number;
  salto: boolean;
}

function indiceActual(offsets: number[], scrollLeft: number): number {
  let actual = 0;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= scrollLeft + 1) actual = i;
    else break;
  }
  return actual;
}

export function proximoOffset(offsets: number[], scrollLeft: number, maximo: number): Passo {
  if (offsets.length === 0) return { esquerda: 0, salto: true };
  const seguinte = indiceActual(offsets, scrollLeft) + 1;
  if (seguinte >= offsets.length || offsets[seguinte] > maximo) {
    return { esquerda: offsets[0], salto: true };
  }
  return { esquerda: offsets[seguinte], salto: false };
}

export function offsetAnterior(offsets: number[], scrollLeft: number, maximo: number): Passo {
  if (offsets.length === 0) return { esquerda: 0, salto: true };
  const actual = indiceActual(offsets, scrollLeft);
  if (actual > 0) return { esquerda: offsets[actual - 1], salto: false };
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (offsets[i] <= maximo) return { esquerda: offsets[i], salto: true };
  }
  return { esquerda: offsets[offsets.length - 1], salto: true };
}
```

- [ ] **Step 4: Correr o teste para confirmar que passa**

Run: `npm run test`
Expected: PASS — 9 novos + existentes, `Test Files` todos `passed`.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/carrossel.ts src/lib/carrossel.test.ts
git commit -m "feat: logica pura de deslocamento do carrossel"
```

---

### Task 2: Componente `Carrossel.astro` reescrito + globals.css

**Files:**
- Modify: `src/components/Carrossel.astro` (reescrever por completo)
- Modify: `src/styles/globals.css:128` (remover `scroll-behavior: smooth;` de `.car`)

**Interfaces:**
- Consumes: `proximoOffset`, `offsetAnterior`, `Passo` da Task 1; classes `.car`/`.arrow`/`.arrow.l`/`.arrow.r` de `globals.css`.
- Produces: `<Carrossel id? auto? setas? intervalo? rotulo?>` — `auto` default `false`, `setas` default `true`, `intervalo` default `4000`, `rotulo` default `'Carrossel'`. Contrato para testes/outras tasks: wrapper `[data-carrossel]` com `data-auto?`, `data-setas?`, `data-intervalo`, `id?`, `role="group"`, `aria-roledescription="carrossel"`, `aria-label={rotulo}`; faixa `ul.car[data-faixa][tabindex=0]`; botões `[data-seta-anterior]`/`[data-seta-seguinte]` (só se `setas`); `[data-sem-movimento]` auto-aplicado quando não há movimento (esconde setas). Os 4 usos existentes (`id="progCar"`, `podCar`, `passouCar`, `vidCar`) continuam a funcionar sem mudar.

- [ ] **Step 1: Remover `scroll-behavior: smooth` de `.car`**

Em `src/styles/globals.css`, na regra `.car` (linhas 124-131), apagar a linha `scroll-behavior: smooth;`. Fica:

```css
.car {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 6px;
}
```

(O JS passa a ditar o comportamento via `scrollTo({ behavior })`, para `prefers-reduced-motion` conseguir scroll instantâneo. A regra `html { scroll-behavior: smooth }` da linha 18 mantém-se.)

- [ ] **Step 2: Reescrever o componente**

Ficheiro completo `src/components/Carrossel.astro`:

```astro
---
interface Props {
  id?: string;
  auto?: boolean;
  setas?: boolean;
  intervalo?: number;
  rotulo?: string;
}

const { id, auto = false, setas = true, intervalo = 4000, rotulo = 'Carrossel' } = Astro.props;
---

<div
  class="relative"
  data-carrossel
  data-auto={auto ? '' : null}
  data-setas={setas ? '' : null}
  data-intervalo={intervalo}
  id={id}
  role="group"
  aria-roledescription="carrossel"
  aria-label={rotulo}
>
  <ul class="car snap-x snap-mandatory" data-faixa tabindex="0">
    <slot />
  </ul>
  {
    setas && (
      <Fragment>
        <button type="button" class="arrow l" data-seta-anterior aria-label={`${rotulo} anterior`}>
          ‹
        </button>
        <button type="button" class="arrow r" data-seta-seguinte aria-label={`${rotulo} seguinte`}>
          ›
        </button>
      </Fragment>
    )
  }
</div>

<style is:global>
  [data-carrossel] [data-faixa] > * {
    scroll-snap-align: start;
  }
  [data-carrossel][data-sem-movimento] .arrow {
    display: none;
  }
</style>

<script>
  import { offsetAnterior, proximoOffset, type Passo } from '../lib/carrossel';

  interface Instancia {
    raiz: HTMLElement;
    faixa: HTMLElement;
    temporizador: number | null;
    intervalo: number;
    auto: boolean;
    sobre: boolean;
    focado: boolean;
    aTocar: boolean;
  }

  const instancias = new Map<HTMLElement, Instancia>();

  const movimentoReduzido = (): boolean =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function offsetsDe(inst: Instancia): number[] {
    return Array.from(inst.faixa.children, (filho) => (filho as HTMLElement).offsetLeft);
  }

  function maximoDe(inst: Instancia): number {
    return inst.faixa.scrollWidth - inst.faixa.clientWidth;
  }

  function cabeTudo(inst: Instancia): boolean {
    return inst.faixa.children.length <= 1 || maximoDe(inst) <= 0;
  }

  function deslizar(inst: Instancia, passo: Passo): void {
    inst.faixa.scrollTo({
      left: passo.esquerda,
      behavior: passo.salto || movimentoReduzido() ? 'auto' : 'smooth',
    });
  }

  function parar(inst: Instancia): void {
    if (inst.temporizador !== null) {
      window.clearInterval(inst.temporizador);
      inst.temporizador = null;
    }
  }

  function arrancar(inst: Instancia): void {
    parar(inst);
    if (!inst.auto || movimentoReduzido() || cabeTudo(inst)) return;
    inst.temporizador = window.setInterval(() => {
      if (cabeTudo(inst)) {
        parar(inst);
        return;
      }
      deslizar(inst, proximoOffset(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
    }, inst.intervalo);
  }

  function actualizarPausa(inst: Instancia): void {
    inst.raiz.toggleAttribute('data-sem-movimento', cabeTudo(inst));
    if (inst.sobre || inst.focado || inst.aTocar || document.hidden) parar(inst);
    else arrancar(inst);
  }

  function mover(inst: Instancia, passo: Passo): void {
    deslizar(inst, passo);
    actualizarPausa(inst);
  }

  function configurar(raiz: HTMLElement): void {
    const faixa = raiz.querySelector<HTMLElement>('[data-faixa]');
    if (!faixa) return;

    const inst: Instancia = {
      raiz,
      faixa,
      temporizador: null,
      intervalo: Number(raiz.dataset.intervalo ?? 4000),
      auto: raiz.hasAttribute('data-auto'),
      sobre: false,
      focado: false,
      aTocar: false,
    };
    instancias.set(raiz, inst);

    raiz.addEventListener('pointerenter', () => {
      inst.sobre = true;
      actualizarPausa(inst);
    });
    raiz.addEventListener('pointerleave', () => {
      inst.sobre = false;
      inst.aTocar = false;
      actualizarPausa(inst);
    });
    raiz.addEventListener('focusin', () => {
      inst.focado = true;
      actualizarPausa(inst);
    });
    raiz.addEventListener('focusout', (evento) => {
      if (evento.relatedTarget instanceof Node && raiz.contains(evento.relatedTarget)) return;
      inst.focado = false;
      actualizarPausa(inst);
    });
    raiz.addEventListener('pointerdown', () => {
      inst.aTocar = true;
      actualizarPausa(inst);
    });
    raiz.addEventListener('pointerup', () => {
      inst.aTocar = false;
      actualizarPausa(inst);
    });
    raiz.addEventListener('pointercancel', () => {
      inst.aTocar = false;
      actualizarPausa(inst);
    });

    raiz.querySelector<HTMLElement>('[data-seta-anterior]')?.addEventListener('click', () => {
      mover(inst, offsetAnterior(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
    });
    raiz.querySelector<HTMLElement>('[data-seta-seguinte]')?.addEventListener('click', () => {
      mover(inst, proximoOffset(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
    });

    faixa.addEventListener('keydown', (evento) => {
      if (evento.key === 'ArrowRight') {
        evento.preventDefault();
        mover(inst, proximoOffset(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        mover(inst, offsetAnterior(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
      }
    });

    actualizarPausa(inst);
  }

  function limpar(): void {
    for (const inst of instancias.values()) parar(inst);
    instancias.clear();
  }

  function iniciar(): void {
    limpar();
    document.querySelectorAll<HTMLElement>('[data-carrossel]').forEach(configurar);
  }

  document.addEventListener('visibilitychange', () => {
    for (const inst of instancias.values()) actualizarPausa(inst);
  });
  window.addEventListener('resize', () => {
    for (const inst of instancias.values()) actualizarPausa(inst);
  });
  document.addEventListener('astro:before-swap', limpar);
  document.addEventListener('astro:page-load', iniciar);
</script>
```

Notas: o script é o port provado do 05 (inclui a correcção `pointerleave` → `aTocar = false`, e `actualizarPausa` que alterna `data-sem-movimento`). `setas` ausente → sem botões; `auto` ausente → sem timer. As setas usam as classes `.arrow`/`.arrow.l`/`.arrow.r` do mockup (globals.css), não há CSS de tamanho de cartão aqui — cada secção define o `flex` dos filhos.

- [ ] **Step 3: Gates**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
"GATES VERDES"
```

Expected: `GATES VERDES` (o componente ainda não é usado — build valida-o como não utilizado; os 4 usos existentes são substituídos na Task 4, mantendo as chamadas compatíveis: `id` continua a ser prop válido).

- [ ] **Step 4: Commit**

```powershell
git add src/components/Carrossel.astro src/styles/globals.css
git commit -m "feat: componente Carrossel reescrito com autoplay e setas do mockup"
```

---

### Task 3: Conteúdo novo (destaques +3, notícias +3)

**Files:**
- Modify: `content/home/destaques.json` (+3 itens, total 7)
- Create: `content/noticias/noite-acustica-kilamba.md`
- Create: `content/noticias/radio-x-chega-ao-kilamba.md`
- Create: `content/noticias/sabores-em-conversa.md`

**Interfaces:**
- Consumes: schemas existentes (`titulo/resumo/tag/imagem/href` em destaques; `titulo/data/tag/resumo/capa/rascunho` em notícias — `tag: z.string()`, sem enum no zod).
- Produces: 7 destaques (garante transbordo: 7×260 + 6×14 = 1904px > 1352px) e 7 notícias (secção da home usa `slice(0, 7)` na Task 4; `/noticias/` passa a listar 7).

- [ ] **Step 1: Acrescentar 3 destaques**

Substitua `content/home/destaques.json` por (os 4 itens actuais + 3 novos, exactos):

```json
{
  "rascunho": false,
  "titulo": "Destaques",
  "itens": [
    {
      "titulo": "Rádio X celebra um ano no ar",
      "resumo": "Um ano de emissão ininterrupta e a programação especial do aniversário.",
      "tag": "Institucional",
      "imagem": "/media/architecture-2562547_1280.jpg",
      "href": "/noticias/radio-x-aniversario/"
    },
    {
      "titulo": "Workshop de locutores inscrições abertas",
      "resumo": "Três dias de formação prática para quem quer voz própria no micro.",
      "tag": "Comunidade",
      "imagem": "/media/mumuila-4586947_1280.jpg",
      "href": "/noticias/workshop-jovens-locutores/"
    },
    {
      "titulo": "Festival Rádio X 2026",
      "resumo": "Data marcada para dezembro, com entrada livre até lotar.",
      "tag": "Concertos",
      "imagem": "/media/angola-2141661_1280.jpg",
      "href": "/concertos/"
    },
    {
      "titulo": "Nova temporada de entrevistas",
      "resumo": "Convidados de todas as artes na Tarde X, às quintas-feiras.",
      "tag": "Entrevistas",
      "imagem": "/media/felisberto-madureira.webp",
      "href": "/noticias/nova-temporada-entrevistas/"
    },
    {
      "titulo": "Festival Verão Luanda começa a contar",
      "resumo": "Contagem decrescente para o maior encontro musical do verão na marginal.",
      "tag": "Eventos",
      "imagem": "/media/noticia-1.svg",
      "href": "/noticias/festival-verao-luanda/"
    },
    {
      "titulo": "Sábado com programação renovada",
      "resumo": "Nova grelha aos sábados, com música angolana das sete da manhã à meia-noite.",
      "tag": "Programação",
      "imagem": "/media/noticia-2.svg",
      "href": "/programas/sabado-x/"
    },
    {
      "titulo": "Nova linha de podcasts no ar",
      "resumo": "Três séries semanais passam a ficar disponíveis em qualquer altura.",
      "tag": "Podcasts",
      "imagem": "/media/noticia-3.svg",
      "href": "/podcasts/"
    }
  ]
}
```

- [ ] **Step 2: Criar 3 notícias**

`content/noticias/noite-acustica-kilamba.md`:

```md
---
titulo: Noite Acústica no Kilamba completa cartaz
data: 2026-10-15
tag: Eventos
resumo: A edição de outubro reúne quatro projetos acústicos no centro cultural do Kilamba.
capa: /media/001.webp
rascunho: false
---

A **Noite Acústica** regressa ao Kilamba a 25 de outubro, com quatro projetos que tocam sem electrónica. Bilhetes à porta e transmissão ao vivo na Rádio X.

A entrada é gratuita até lotar. Mais detalhes na página de [concertos](/concertos/).
```

`content/noticias/radio-x-chega-ao-kilamba.md`:

```md
---
titulo: Rádio X amplia o sinal para o Kilamba
data: 2026-10-12
tag: Institucional
resumo: Novo repetidor garante cobertura estável em toda a zona do Kilamba e arredores.
capa: /media/784981923_1092628363282732_2773791522913315368_n.jpg
rascunho: false
---

A Rádio X passou a cobrir o Kilamba com um repetidor novo, sem cortes nem interferências. A afinação continua a ser **90.3 FM**.

O sinal reforçado chega também às zonas vizinhas de Viana e Belas.
```

`content/noticias/sabores-em-conversa.md`:

```md
---
titulo: Sabores angolanos em conversa na Tarde X
data: 2026-10-05
tag: Entrevistas
resumo: Cozinheiros e produtores locais falam de receitas de família na rubrica semanal.
capa: /media/sabor-angolano.webp
rascunho: false
---

O programa **Sabor Angolano** entrevista cozinheiras e produtores locais às quintas, na Tarde X. Esta semana: funge, mucua e o mercado do Kilamba.

Ouve o episódio na página do [programa](/programas/tarde-x/).
```

- [ ] **Step 3: Gates + verificação de conteúdo**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
'noticias: ' + (Get-ChildItem content\noticias -Filter *.md).Count
```

Expected: gates verdes; `noticias: 7` (o zod valida os frontmatters novos — se um falhar, o build falha).

- [ ] **Step 4: Commit**

```powershell
git add content/home/destaques.json content/noticias/
git commit -m "feat: conteudo novo de destaques e noticias para transbordar"
```

---

### Task 4: Integração nas secções (Destaques, Notícias, tira, Passou)

**Files:**
- Modify: `src/components/DestaquesSecao.astro`
- Modify: `src/components/NoticiasSecao.astro`
- Modify: `src/components/ProgramasSecao.astro` (só a variante `tira`: `div.item` → `li.item`)
- Modify: `src/components/PassouSecao.astro` (só: `div.item` → `li.item`)

**Interfaces:**
- Consumes: `<Carrossel>` da Task 2 (`id`, `auto`, `setas`, `intervalo`, `rotulo`); conteúdo da Task 3.
- Produces: homepage com exactamente 2 `[data-carrossel][data-auto]` — Destaques `data-intervalo="5000"` `aria-label="Destaques"`, Notícias `data-intervalo="4000"` `aria-label="Notícias"`; grelha "EM DESTAQUE" com `slice(0, 4)`; faixa de notícias com 7 `li` + 1 `li.sponsor`, todos `style="flex:0 0 300px"`; os 4 carrosseis existentes sem `auto` (setas manuais).

- [ ] **Step 1: DestaquesSecao**

Substitua `src/components/DestaquesSecao.astro` por:

```astro
---
import { destaquesPublicados } from '../lib/conteudo';
import Carrossel from './Carrossel.astro';
import Imagem from './Imagem.astro';
import Secao from './Secao.astro';

interface Props {
  variante?: 'grelha' | 'carrossel';
  id?: string;
}
const { variante = 'grelha', id = 'destaques' } = Astro.props;

const destaques = await destaquesPublicados();
const itens = destaques?.itens ?? [];
---

{
  itens.length > 0 && variante === 'grelha' ? (
    <Secao id={id} titulo={destaques?.titulo ?? 'Em destaque'}>
      <ul class="hero-row">
        {itens.slice(0, 4).map((item, i) => (
          <li class:list={['big', (i === 0 || i === 3) && 'wide']}>
            {item.href && <a href={item.href} class="absolute inset-0 z-[3]" aria-label={item.titulo} />}
            <Imagem src={item.imagem} alt={item.titulo} classe="size-full absolute inset-0 object-cover" emoji="✨" />
            <span class="cap">
              {item.tag && <span class="text-destaque">{item.tag} · </span>}
              {item.titulo}
            </span>
          </li>
        ))}
      </ul>
    </Secao>
  ) : itens.length > 0 ? (
    <Secao id={id} titulo={destaques?.titulo ?? 'Destaques'} href="/noticias/" rotulo="VER MAIS">
      <Carrossel id="destaquesCar" auto setas intervalo={5000} rotulo="Destaques">
        {itens.map((item) => (
          <li class="item" style="flex:0 0 260px">
            <div class="thumb">
              <Imagem src={item.imagem} alt={item.titulo} classe="size-full absolute inset-0" emoji="⭐" />
            </div>
            <div class="txt">
              {item.href ? <a href={item.href}>{item.titulo}</a> : item.titulo}
            </div>
          </li>
        ))}
      </Carrossel>
    </Secao>
  ) : null
}
```

Mudanças: import `Carrossel`; grelha usa `itens.slice(0, 4)` (wide em `i === 0 || i === 3` — com slice(0,4) é equivalente ao actual); variante `carrossel` passa o `<ul>` bruto para `<Carrossel id="destaquesCar" auto setas intervalo={5000} rotulo="Destaques">` com os 7 `li.item`.

- [ ] **Step 2: NoticiasSecao**

Substitua `src/components/NoticiasSecao.astro` por:

```astro
---
import { noticiasPublicadas, patrocinadoresPublicados } from '../lib/conteudo';
import { formatarData } from '../lib/formatos';
import Carrossel from './Carrossel.astro';
import Imagem from './Imagem.astro';
import Secao from './Secao.astro';

const noticias = (await noticiasPublicadas()).slice(0, 7);
const patrocinador = (await patrocinadoresPublicados())[0];
---

{
  noticias.length > 0 && (
    <Secao id="noticias" titulo="NOTÍCIAS" href="/noticias/" rotulo="VER MAIS">
      <Carrossel id="noticiasCar" auto setas intervalo={4000} rotulo="Notícias">
        {noticias.map((noticia) => (
          <li class="item" style="flex:0 0 300px">
            <a href={`/noticias/${noticia.id}/`} class="block">
              <div class="thumb">
                <Imagem src={noticia.data.capa} alt={noticia.data.titulo} classe="size-full absolute inset-0" emoji="📰" />
                <span class="play-badge">▶</span>
              </div>
              <div class="txt">
                <span class="text-destaque">{noticia.data.tag}</span> · {formatarData(noticia.data.data)}
                <div class="mt-1 font-bold">{noticia.data.titulo}</div>
              </div>
            </a>
          </li>
        ))}
        {patrocinador && (
          <li class="sponsor" style="flex:0 0 300px">
            <div class="thumb" style="height:150px">
              <Imagem src={patrocinador.data.logo} alt={patrocinador.data.nome} classe="size-full absolute inset-0" emoji="💳" />
            </div>
            <div class="cap">{patrocinador.data.nome}</div>
            <span class="lbl">Conteúdo patrocinado</span>
          </li>
        )}
      </Carrossel>
    </Secao>
  )
}
```

Mudanças: `slice(0, 3)` → `slice(0, 7)`; `ul.news-grid` → `<Carrossel id="noticiasCar" auto setas intervalo={4000} rotulo="Notícias">`; `li.item` ganha `style="flex:0 0 300px"` (perde `style="flex:none"`); `li.sponsor` ganha `style="flex:0 0 300px"`.

- [ ] **Step 3: ProgramasSecao (tira) — `div` → `li`**

Em `src/components/ProgramasSecao.astro`, bloco `variante === 'tira'` (linhas 57-71), trocar o `<div class="item">` externo por `<li class="item">` (fecho `</li>`). Fica:

```astro
{
  programas.length > 0 && variante === 'tira' && (
    <Secao id={id} titulo="Programas" href="/programas/" rotulo="Todos os programas">
      <Carrossel id="progCar">
        {programas.map((programa) => (
          <li class="item">
            <div class="thumb">
              <Imagem src={programa.data.imagem} alt={programa.data.nome} classe="size-full absolute inset-0" emoji="🎙️" />
            </div>
            <div class="txt">{programa.data.nome}</div>
          </li>
        ))}
      </Carrossel>
    </Secao>
  )
}
```

- [ ] **Step 4: PassouSecao — `div` → `li`**

Em `src/components/PassouSecao.astro`, trocar o `<div class="item">` interno (linha 18) por `<li class="item">` e o fecho correspondente por `</li>`:

```astro
{itens.map((faixa) => (
  <li class="item">
    <div class="time">{faixa.hora}</div>
    <div class="disc">
      <div class="vinyl" />
    </div>
    <div class="who">
      <b>{faixa.artista}</b>
      {faixa.musica}
    </div>
  </li>
))}
```

- [ ] **Step 5: Verificar na home construída**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
$h = Get-Content dist\index.html -Raw
'autos: ' + ([regex]::Matches($h, 'data-carrossel[^>]*data-auto')).Count
'5000: ' + $(if ($h -match 'data-intervalo="5000"') {'ok'} else {'FALTA'})
'4000: ' + $(if ($h -match 'data-intervalo="4000"') {'ok'} else {'FALTA'})
'destaquesCar: ' + $(if ($h -match 'id="destaquesCar"') {'ok'} else {'FALTA'})
'noticiasCar: ' + $(if ($h -match 'id="noticiasCar"') {'ok'} else {'FALTA'})
'passou li: ' + $(if ($h -match 'id="passou"[\s\S]*?<li class="item"') {'ok'} else {'FALTA'})
```

Expected: `autos: 2`, todos os outros `ok`.

- [ ] **Step 6: Gates + commit**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
git add src/components/DestaquesSecao.astro src/components/NoticiasSecao.astro src/components/ProgramasSecao.astro src/components/PassouSecao.astro
git commit -m "feat: carrosseis com autoplay nos destaques e noticias"
```

---

### Task 5: Testes smoke (4 novos) + gates finais + push

**Files:**
- Modify: `tests/smoke.spec.ts` (adicionar `test.describe('carrosséis da homepage')` no fim)

**Interfaces:**
- Consumes: contrato da Task 2 (`[data-carrossel][data-auto]`, `data-intervalo`, `aria-label` no wrapper, `[data-faixa]`) e da Task 4 (2 autoplays na home).
- Produces: smoke = 16 existentes + 4 novos = **20** verdes; `main` pushada → CD Vercel.

- [ ] **Step 1: Escrever os 4 testes (vermelho)**

Acrescente ao fim de `tests/smoke.spec.ts`:

```ts
test.describe('carrosséis da homepage', () => {
  test('a homepage tem exactamente 2 carrosséis com autoplay', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-carrossel][data-auto]')).toHaveCount(2);
    await expect(page.locator('[data-carrossel][data-auto][data-intervalo="5000"]')).toHaveCount(1);
    await expect(page.locator('[data-carrossel][data-auto][data-intervalo="4000"]')).toHaveCount(1);
  });

  test('os destaques avançam sozinhos', async ({ page }) => {
    await page.goto('/');
    const faixa = page.locator('[aria-label="Destaques"] [data-faixa]');
    await expect(faixa).toHaveCount(1);
    const antes = await faixa.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(6000);
    const depois = await faixa.evaluate((el) => el.scrollLeft);
    expect(depois).not.toBe(antes);
  });

  test('as notícias avançam sozinhas', async ({ page }) => {
    await page.goto('/');
    const faixa = page.locator('[aria-label="Notícias"] [data-faixa]');
    await expect(faixa).toHaveCount(1);
    const antes = await faixa.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(5000);
    const depois = await faixa.evaluate((el) => el.scrollLeft);
    expect(depois).not.toBe(antes);
  });

  test('hover pausa e a seta seguinte dos destaques move a faixa', async ({ page }) => {
    await page.goto('/');
    const raiz = page.locator('[data-carrossel][data-auto][data-intervalo="5000"]');
    await expect(raiz).toHaveCount(1);
    await raiz.hover();
    const faixa = raiz.locator('[data-faixa]');
    const antes = await faixa.evaluate((el) => el.scrollLeft);
    await raiz.getByRole('button', { name: 'Destaques seguinte' }).click();
    await expect
      .poll(() => faixa.evaluate((el) => el.scrollLeft), { timeout: 5000 })
      .toBeGreaterThan(antes);
  });
});
```

Notas: o `hover()` antes do clique pausa o autoplay (pausa no hover), para o avanço ser atribuível à seta. `toHaveCount` no início faz o vermelho falhar rápido.

- [ ] **Step 2: Build e smoke para confirmar vermelho→verde**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
npm run smoke
```

Expected: **20 passed** (4 novos + 16 existentes). Se os testes de autoplay falharem por o conteúdo não transbordar, revisar a Task 3 (não deve acontecer — 1904px/2498px > 1352px). Se falhar o flake pré-existente do player (wav 3s), re-correr `npm run smoke` para confirmar.

- [ ] **Step 3: Gates finais**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
"GATES VERDES"
```

Expected: `GATES VERDES`.

- [ ] **Step 4: Commit + push (CD Vercel)**

```powershell
git add tests/smoke.spec.ts
git commit -m "test: smoke dos carrosseis de destaques e noticias"
git push
```

Expected: push aceite; o CD da Vercel deploya (confirmar ~90 s depois: `(Invoke-WebRequest -Uri 'https://<url>/ ' -UseBasicParsing).StatusCode` → `200`, se o URL estiver registado no README).

---

## Self-Review

- Spec coverage: conteúdo +3/+3 (T3), Destaques autoplay 5000 + grelha slice(0,4) (T4), Notícias carrossel 4000 + slice 7 + patrocinador (T4), 4 secções existentes sem autoplay (T2 defaults + T4 sem `auto`), reduced-motion/View Transitions/a11y (T2 script), `globals.css` remove smooth (T2), 9 testes unit (T1), 4 smoke = 20 (T5), push/CD (T5).
- Placeholder scan: sem TBD/TODO; todos os passos têm código/comandos exactos; JSON/md completos.
- Type consistency: `Passo`/`proximoOffset`/`offsetAnterior` iguais entre T1/T2; props do `Carrossel` (`id?/auto?/setas?/intervalo?/rotulo?`) usadas em T4 como definidas em T2; `aria-label="Destaques"`/`"Notícias"` em T5 = `rotulo` em T4.
