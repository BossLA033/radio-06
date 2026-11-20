# Deslize Contínuo nos Destaques (marquee) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A secção DESTAQUES da homepage do radio-06 passa de salto automático (5000 ms) para deslize contínuo a ~30 px/s em loop infinito, com setas que pausam e pausa no hover/foco/toque.

**Architecture:** Modo novo `deslize` no `Carrossel.astro` existente: no init, os cards reais são clonados uma vez (`aria-hidden`), mede-se a largura do original (`ciclo`), e um `requestAnimationFrame` soma `velocidade · dt` a `scrollLeft`, subtraindo `ciclo` ao ultrapassar — loop invisível. Reutiliza toda a lógica de pausa/setas/reduced-motion já provada. `DestaquesSecao` troca `auto intervalo={5000}` por `deslize velocidade={30}`.

**Tech Stack:** Astro 5 (ClientRouter), rAF vanilla (zero dependências), Vitest (inalterado), Playwright smoke.

**Spec:** `docs/superpowers/specs/2026-11-20-destaques-deslize-continuo-design.md`

## Global Constraints

- **Zero dependências novas.** Só mudam: `src/components/Carrossel.astro`, `src/components/DestaquesSecao.astro`, `tests/smoke.spec.ts` (+ plano/spec em `docs/`).
- Velocidade **30 px/s**; `dt` com clamp de 100 ms; `prefers-reduced-motion` → sem deriva, setas `behavior: 'auto'`.
- Clones: `aria-hidden="true"` + `tabindex="-1"`; só 1 cópia; contagem de cards **reais** (sem clones) é o guard de `cabeTudo`.
- `data-auto` emitido também em modo `deslize` (contrato dos testes: homepage tem exactamente 2 `[data-auto]`).
- Notícias e restantes 4 secções **intocadas** (salto 4000 ms / setas manuais).
- Commits sem acentos; gates antes de cada commit: `check`, `lint`, `test`, `build` → 0; **build antes de smoke**; smoke = 21.
- Shell PowerShell 5.1: sem `&&`. Push no fim → CD Vercel.

---

### Task 1: Modo `deslize` no `Carrossel.astro`

**Files:**
- Modify: `src/components/Carrossel.astro` (Props + wrapper + script)

**Interfaces:**
- Consumes: `proximoOffset`/`offsetAnterior`/`Passo` de `src/lib/carrossel.ts` (inalterado).
- Produces: props novas `deslize?: boolean` (default `false`) e `velocidade?: number` (default `30`); atributos `data-deslize` e `data-velocidade` no wrapper; `data-auto` presente quando `auto || deslize`. Consumido pela Task 2 (`<Carrossel deslize velocidade={30}>`).

- [ ] **Step 1: Props e wrapper**

Em `src/components/Carrossel.astro`, frontmatter:

```astro
---
interface Props {
  id?: string;
  auto?: boolean;
  deslize?: boolean;
  setas?: boolean;
  intervalo?: number;
  velocidade?: number;
  rotulo?: string;
}

const {
  id,
  auto = false,
  deslize = false,
  setas = true,
  intervalo = 4000,
  velocidade = 30,
  rotulo = 'Carrossel',
} = Astro.props;
---
```

Wrapper — trocar as linhas `data-auto`/`data-intervalo` por:

```astro
<div
  class="relative"
  data-carrossel
  data-auto={auto || deslize ? '' : null}
  data-deslize={deslize ? '' : null}
  data-velocidade={velocidade}
  data-setas={setas ? '' : null}
  data-intervalo={intervalo}
  id={id}
  role="group"
  aria-roledescription="carrossel"
  aria-label={rotulo}
>
```

- [ ] **Step 2: Interface `Instancia` e funções de conteúdo**

No `<script>`, acrescentar à interface:

```ts
  interface Instancia {
    raiz: HTMLElement;
    faixa: HTMLElement;
    temporizador: number | null;
    intervalo: number;
    auto: boolean;
    deslize: boolean;
    velocidade: number;
    ciclo: number;
    raf: number | null;
    ultimoTempo: number | null;
    sobre: boolean;
    focado: boolean;
    aTocar: boolean;
  }
```

Substituir `cabeTudo` por (conta só cards reais — sem clones):

```ts
  function reaisDe(inst: Instancia): Element[] {
    return Array.from(inst.faixa.children).filter(
      (filho) => filho.getAttribute('aria-hidden') !== 'true',
    );
  }

  function cabeTudo(inst: Instancia): boolean {
    if (reaisDe(inst).length <= 1) return true;
    return !inst.deslize && maximoDe(inst) <= 0;
  }
```

- [ ] **Step 3: Clonagem + medição do ciclo**

Nova função (colocar antes de `configurar`):

```ts
  function clonarParaLoop(inst: Instancia): void {
    const reais = Array.from(inst.faixa.children);
    if (reais.length <= 1) return;
    for (const filho of reais) {
      const clone = filho.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      inst.faixa.appendChild(clone);
    }
    const primeiroReal = reais[0] as HTMLElement;
    const primeiroClone = inst.faixa.children[reais.length] as HTMLElement;
    inst.ciclo = primeiroClone.offsetLeft - primeiroReal.offsetLeft;
  }
```

- [ ] **Step 4: `parar`/`arrancar` com rAF**

Substituir `parar`:

```ts
  function parar(inst: Instancia): void {
    if (inst.temporizador !== null) {
      window.clearInterval(inst.temporizador);
      inst.temporizador = null;
    }
    if (inst.raf !== null) {
      cancelAnimationFrame(inst.raf);
      inst.raf = null;
      inst.ultimoTempo = null;
    }
  }
```

Substituir `arrancar`:

```ts
  function arrancar(inst: Instancia): void {
    parar(inst);
    if (movimentoReduzido() || cabeTudo(inst)) return;
    if (inst.deslize) {
      inst.ultimoTempo = null;
      const frame = (t: number): void => {
        if (inst.raf === null) return;
        if (cabeTudo(inst) || movimentoReduzido()) {
          parar(inst);
          return;
        }
        const anterior = inst.ultimoTempo ?? t;
        inst.ultimoTempo = t;
        const dt = Math.min(t - anterior, 100) / 1000;
        let esquerda = inst.faixa.scrollLeft + inst.velocidade * dt;
        if (inst.ciclo > 0 && esquerda >= inst.ciclo) esquerda -= inst.ciclo;
        inst.faixa.scrollLeft = esquerda;
        inst.raf = requestAnimationFrame(frame);
      };
      inst.raf = requestAnimationFrame(frame);
      return;
    }
    if (!inst.auto) return;
    inst.temporizador = window.setInterval(() => {
      if (cabeTudo(inst)) {
        parar(inst);
        return;
      }
      deslizar(inst, proximoOffset(offsetsDe(inst), inst.faixa.scrollLeft, maximoDe(inst)));
    }, inst.intervalo);
  }
```

Notas de comportamento:
- O `.car` já não tem `scroll-behavior: smooth` (ciclo anterior) → escrever `scrollLeft` por frame dá deriva suave e sem luta com CSS.
- `actualizarPausa` (inalterada) decide entre `parar`/`arrancar`: hover/foco/toque/tab oculto páram (cancelam o rAF); sair retoma com `ultimoTempo = null` (sem salto de dt).
- Setas/teclado durante a deriva: `pointerenter`/`focusin` chegam primeiro → pausa → `mover` faz `scrollTo` sem concorrência; retoma no `pointerleave`/`focusout`.
- Wrap: `esquerda >= ciclo` subtrai `ciclo` — a cópia é idêntica, emenda invisível.

- [ ] **Step 5: `configurar` — novos campos + clonagem**

No objecto `inst` dentro de `configurar`, acrescentar:

```ts
      deslize: raiz.hasAttribute('data-deslize'),
      velocidade: Number(raiz.dataset.velocidade ?? 30),
      ciclo: 0,
      raf: null,
      ultimoTempo: null,
```

E logo após `instancias.set(raiz, inst);`:

```ts
    if (inst.deslize) clonarParaLoop(inst);
```

- [ ] **Step 6: Gates + commit**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
git add src/components/Carrossel.astro
git commit -m "feat: modo deslize continuo no componente Carrossel"
```

Expected: gates verdes (nenhum consumidor de `deslize` ainda — build valida só a sintaxe/tipos).

---

### Task 2: Integração nos Destaques + smoke (red→verde) + push

**Files:**
- Modify: `src/components/DestaquesSecao.astro` (variante `carrossel`)
- Modify: `tests/smoke.spec.ts` (ajustar teste 1 + 1 teste novo)

**Interfaces:**
- Consumes: `<Carrossel deslize velocidade={30}>` da Task 1.
- Produces: homepage com exactamente 1 `[data-carrossel][data-deslize]` (Destaques) e 2 `[data-auto]` (Destaques + Notícias); smoke = 21 verdes; produção actualizada.

- [ ] **Step 1: Ajustar o teste existente (vermelho)**

Em `tests/smoke.spec.ts`, no primeiro teste do describe `carrosséis da homepage`, substituir:

```ts
    await expect(page.locator('[data-carrossel][data-auto]')).toHaveCount(2);
    await expect(page.locator('[data-carrossel][data-auto][data-intervalo="5000"]')).toHaveCount(1);
    await expect(page.locator('[data-carrossel][data-auto][data-intervalo="4000"]')).toHaveCount(1);
```

por:

```ts
    await expect(page.locator('[data-carrossel][data-auto]')).toHaveCount(2);
    await expect(page.locator('[data-carrossel][data-deslize]')).toHaveCount(1);
    await expect(page.locator('[data-carrossel][data-auto][data-intervalo="4000"]')).toHaveCount(1);
```

(Renomear o teste para `'a homepage tem 2 carrosséis automáticos, um em deslize'`.)

- [ ] **Step 2: Teste novo da deriva (vermelho)**

Acrescentar no mesmo describe:

```ts
  test('os destaques deslizam continuamente', async ({ page }) => {
    await page.goto('/');
    const faixa = page.locator('[aria-label="Destaques"] [data-faixa]');
    await expect(faixa).toHaveCount(1);
    const antes = await faixa.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(2000);
    const depois = await faixa.evaluate((el) => el.scrollLeft);
    expect(depois).toBeGreaterThan(antes);
  });
```

Notas: 30 px/s × 2 s = ~60 px > 0 — deriva contínua (o salto antigo de 5 s daria 0). Os testes "avançam sozinhos" (6 s) e "hover pausa + seta" continuam válidos sem alterações.

- [ ] **Step 3: Build + smoke para confirmar vermelho**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
npm run smoke
```

Expected: **2 falhas** — `'a homepage tem 2 carrosséis...'` (`[data-deslize]` Received: 0) e `'os destaques deslizam continuamente'` (`depois` = `antes`, sem deriva); os restantes 19 passam.

- [ ] **Step 4: Integrar nos Destaques**

Em `src/components/DestaquesSecao.astro`, variante `carrossel`, trocar:

```astro
      <Carrossel id="destaquesCar" auto setas intervalo={5000} rotulo="Destaques">
```

por:

```astro
      <Carrossel id="destaquesCar" deslize velocidade={30} setas rotulo="Destaques">
```

(Nada mais muda no ficheiro.)

- [ ] **Step 5: Build + smoke para confirmar verde**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
npm run smoke
```

Expected: **21 passed**.

- [ ] **Step 6: Verificação no HTML construído**

```powershell
$h = Get-Content dist\index.html -Raw
'deslize: ' + $(if ($h -match 'data-deslize') {'ok'} else {'FALTA'})
'velocidade: ' + $(if ($h -match 'data-velocidade="30"') {'ok'} else {'FALTA'})
'autos: ' + ([regex]::Matches($h, 'data-carrossel[^>]*data-auto')).Count
```

Expected: `deslize: ok`, `velocidade: ok`, `autos: 2`.

- [ ] **Step 7: Gates finais + commit + push**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "CHECK FALHOU"; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { "LINT FALHOU"; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { "TEST FALHOU"; exit 1 }
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { "BUILD FALHOU"; exit 1 }
git add src/components/DestaquesSecao.astro tests/smoke.spec.ts
git commit -m "feat: destaques em deslize continuo a 30px/s"
git push
```

Expected: push aceite (rebase primeiro se o admin tiver commits novos: `git pull --rebase origin main`).

- [ ] **Step 8: Confirmar produção**

```powershell
Start-Sleep -Seconds 95
$h = (Invoke-WebRequest -Uri 'https://radio-06.vercel.app/' -UseBasicParsing -TimeoutSec 30).Content
'deslize prod: ' + $(if ($h -match 'data-deslize') {'ok'} else {'FALTA'})
```

Expected: `deslize prod: ok`.

---

## Self-Review

- **Spec coverage:** props `deslize`/`velocidade` + `data-auto` (T1 S1), clonagem aria-hidden (T1 S3), rAF com clamp 100 ms e wrap `-= ciclo` (T1 S4), `cabeTudo` por reais (T1 S2), reduced-motion (T1 S4, `arrancar`), pausa/retoma e setas (lógica existente intacta), Destaques `deslize velocidade={30}` e sem `intervalo` (T2 S4), smoke 1 novo + 1 ajuste = 21 (T2 S1-S2), push/CD (T2 S7-S8).
- **Placeholder scan:** sem TBD/TODO; todos os passos com código exacto.
- **Type consistency:** `deslize`/`velocidade` definidos nas Props (T1 S1) e lidos em `configurar` (T1 S5) com os mesmos nomes; `reaisDe`/`clonarParaLoop` definidos (T1 S2-S3) e usados (T1 S4-S5); selector `[data-deslize]` do teste (T2 S1) = atributo do wrapper (T1 S1); `aria-label="Destaques"` = `rotulo="Destaques"` (T2 S4).
