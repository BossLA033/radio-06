# Logo no header + favicon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Colocar o logotipo original da Rádio X (imagem transparente) no header do site e adicionar favicon/manifest ao `RAdio_06`, sem tocar no footer nem no tema.

**Architecture:** Assets estáticos já existentes são copiados para `public/`; o `Header.astro` troca os spans de texto por um `<img>` com dimensões declaradas; o `Base.astro` ganha os `<link rel="icon">` + manifest no `<head>`. Zero JS novo, zero dependências, zero alterações de dados/admin.

**Tech Stack:** Astro 5 estático, Tailwind 4 (classes utilitárias no `<img>`), ficheiros PNG/ICO existentes em `Site_radio_X`, PowerShell 5.1, gates `npm run build/check/lint/test`, Vercel (CD por push).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-13-logo-header-favicon-design.md` (aprovada).
- Repo de trabalho: `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06` (workdir de todos os comandos).
- **RAdio_05 intocado.** Footer mantém wordmark de texto (não mexer em `Footer.astro`).
- Classes `.wordmark`/`.freq` mantêm-se no CSS (só removem do header).
- Commits **sem acentos**, estilo `feat:`/`chore:`/`docs:`. Mensagens exactas indicadas.
- Gates antes de **cada push**: `npm run build`, `npm run check`, `npm run lint`, `npm run test` → exit 0.
- Shell **PowerShell 5.1**: sem `&&`; usar `; if ($?) { ... }` ou `if ($LASTEXITCODE -ne 0) { ... exit 1 }`.
- Identidade git local do repo: `bidonpequeno <bidonpequeno@gmail.com>` (já configurada).
- Deploy automático por push no Vercel (`https://radio-06.vercel.app`); `/admin/` do Vercel é só noindex — nunca testar login/publicação lá.
- Imagem do logo: `logo_radio_x_transparent.png` (não o `.jpg` quadrado).

---

### Task 1: Copiar assets + criar manifest

**Files:**
- Create: `public/logo/logo_radio_x_transparent.png`
- Create: `public/favicon.ico`
- Create: `public/favicon-32.png`
- Create: `public/favicon-64.png`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/site.webmanifest`

**Interfaces:**
- Produces: ficheiros servidos em `/logo/logo_radio_x_transparent.png`, `/favicon.ico`, `/favicon-32.png`, `/favicon-64.png`, `/icon-192.png`, `/icon-512.png`, `/site.webmanifest` (consumidos pela Task 2 — `<img src>` — e Task 3 — `<link href>`).

- [ ] **Step 1: Criar pasta do logo e copiar todos os assets**

```powershell
$origem = 'C:\Users\breno\Documents\Antigraviti_texte'
New-Item -ItemType Directory -Path 'public\logo' -Force | Out-Null
Copy-Item "$origem\Site_radio_X\radio-x-903\images\logo\logo_radio_x_transparent.png" 'public\logo\logo_radio_x_transparent.png' -Force
Copy-Item "$origem\Site_radio_X\radio-x-v3\src\app\favicon.ico" 'public\favicon.ico' -Force
Copy-Item "$origem\Site_radio_X\radio-x-903\images\logo\favicon-32.png" 'public\favicon-32.png' -Force
Copy-Item "$origem\Site_radio_X\radio-x-903\images\logo\favicon-64.png" 'public\favicon-64.png' -Force
Copy-Item "$origem\Site_radio_X\radio-x-903\images\logo\icon-192.png" 'public\icon-192.png' -Force
Copy-Item "$origem\Site_radio_X\radio-x-903\images\logo\icon-512.png" 'public\icon-512.png' -Force
Get-ChildItem 'public\logo', 'public\favicon*', 'public\icon-*' | Select-Object Name, Length
```

Expected: 7 ficheiros listados com tamanho > 0 (logo ~12 KB, favicon.ico ~25 KB, 32/64/192/512 PNG presentes).

- [ ] **Step 2: Criar `public/site.webmanifest`**

Conteúdo exacto do ficheiro:

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

- [ ] **Step 3: Validar JSON do manifest**

```powershell
Get-Content 'public\site.webmanifest' -Raw | ConvertFrom-Json | Out-Null; if ($?) { 'JSON OK' }
```

Expected: `JSON OK`.

- [ ] **Step 4: Build + confirmar assets no `dist/`**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { 'BUILD FALHOU'; exit 1 }
@('favicon.ico','favicon-32.png','favicon-64.png','icon-192.png','icon-512.png','site.webmanifest','logo\logo_radio_x_transparent.png') | ForEach-Object { $ok = Test-Path "dist\$_"; "$_ : $(if ($ok) {'ok'} else {'FALTA'})" }
```

Expected: todos `ok`.

- [ ] **Step 5: Commit**

```powershell
git add public/logo public/favicon.ico public/favicon-32.png public/favicon-64.png public/icon-192.png public/icon-512.png public/site.webmanifest
git commit -m "feat: assets de logo e favicon"
```

(Commit local; push conjunto na Task 4 após gates finais — ou push aqui se preferir CD incremental; ver nota da Task 4.)

---

### Task 2: Logo no header

**Files:**
- Modify: `src/components/Header.astro:24-27`

**Interfaces:**
- Consumes: `/logo/logo_radio_x_transparent.png` (Task 1), `d.nome` de `definicoes()` (já importado no topo do ficheiro).
- Produces: header com `<img>` acessível (`alt={d.nome}`, `aria-label` no link); spans `wordmark`/`freq` removidos **apenas** deste ficheiro.

- [ ] **Step 1: Substituir o link do logo no Header**

Em `src/components/Header.astro`, substituir exactamente as linhas 24-27:

```astro
    <a href="/" class="flex flex-col" aria-label={`${d.nome} — página inicial`}>
      <span class="wordmark">{d.nome}</span>
      <span class="freq">{d.frequencia}</span>
    </a>
```

por:

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

(Não tocar no resto do ficheiro — nav, menu móvel e script mantêm-se.)

- [ ] **Step 2: Verificar que o footer e o CSS não foram tocados**

```powershell
Select-String -Path 'src\components\Footer.astro' -Pattern 'wordmark' | ForEach-Object { $_.LineNumber.ToString() + ': ' + $_.Line.Trim() }
Select-String -Path 'src\styles\globals.css' -Pattern '\.wordmark|\.freq' | ForEach-Object { $_.LineNumber.ToString() + ': ' + $_.Line.Trim() }
Select-String -Path 'src\components\Header.astro' -Pattern 'wordmark|freq' 
```

Expected: Footer e globals.css com ocorrências; **Header sem ocorrências** (última busca vazia).

- [ ] **Step 3: Build + verificar `<img>` no HTML**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { 'BUILD FALHOU'; exit 1 }
$h = Get-Content 'dist\index.html' -Raw
'img-logo: ' + $(if ($h -match 'logo_radio_x_transparent\.png') {'ok'} else {'FALTA'})
'alt: ' + $(if ($h -match 'alt="R') {'ok'} else {'FALTA'})
```

Expected: ambos `ok`.

- [ ] **Step 4: Check + lint + commit**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'CHECK FALHOU'; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { 'LINT FALHOU'; exit 1 }
git add src/components/Header.astro
git commit -m "feat: logo original no header"
```

---

### Task 3: Favicon + manifest no head

**Files:**
- Modify: `src/layouts/Base.astro` (bloco `<head>`, antes de `<title>` — actual linha 39)

**Interfaces:**
- Consumes: `/favicon.ico`, `/favicon-32.png`, `/favicon-64.png`, `/icon-192.png`, `/site.webmanifest` (Task 1).
- Produces: `<head>` com 5 `<link>` novos (icon ×3, apple-touch-icon, manifest) — verificados no `dist/index.html`.

- [ ] **Step 1: Acrescentar os links no `<head>`**

Em `src/layouts/Base.astro`, imediatamente **antes** de `<title>{tituloCompleto}</title>`, inserir:

```html
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/png" href="/favicon-32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="/favicon-64.png" sizes="64x64" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <link rel="manifest" href="/site.webmanifest" />
```

(Não mover os `<link>` do Google Fonts nem o `<slot name="head">`.)

- [ ] **Step 2: Build + verificar links no HTML**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { 'BUILD FALHOU'; exit 1 }
$h = Get-Content 'dist\index.html' -Raw
'icon-ico: ' + $(if ($h -match 'rel="icon" href="/favicon\.ico"') {'ok'} else {'FALTA'})
'icon-32: ' + $(if ($h -match 'favicon-32\.png') {'ok'} else {'FALTA'})
'apple: ' + $(if ($h -match 'apple-touch-icon') {'ok'} else {'FALTA'})
'manifest: ' + $(if ($h -match 'rel="manifest"') {'ok'} else {'FALTA'})
```

Expected: todos `ok`.

- [ ] **Step 3: Gates + commit**

```powershell
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'CHECK FALHOU'; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { 'LINT FALHOU'; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'TEST FALHOU'; exit 1 }
git add src/layouts/Base.astro
git commit -m "feat: favicon e manifest no head"
```

---

### Task 4: Gates finais + push + verificação remota

**Files:**
- Nenhum ficheiro novo (verificação + push dos commits das Tasks 1-3).

**Interfaces:**
- Consumes: commits locais das Tasks 1-3; site Vercel `https://radio-06.vercel.app`.
- Produces: `main` == `origin/main`, deploy Vercel no ar com logo + favicon.

- [ ] **Step 1: Gates completos**

```powershell
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { 'BUILD FALHOU'; exit 1 }
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'CHECK FALHOU'; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { 'LINT FALHOU'; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'TEST FALHOU'; exit 1 }
'GATES VERDES'
```

Expected: `GATES VERDES`.

- [ ] **Step 2: Push (rebase se o remoto tiver commits novos do admin)**

```powershell
git pull --rebase origin main
git push origin main
git status -sb
```

Expected: `## main...origin/main` (sem ahead/behind). Se o rebase encontrar conflitos em `Header.astro`/`Base.astro` (publicação do admin não deve tocá-los), resolver mantendo a nossa versão.

- [ ] **Step 3: Confirmar status do deploy Vercel**

```powershell
Start-Sleep -Seconds 45
gh api repos/BossLA033/radio-06/commits/HEAD/status --jq '{state, statuses: [.statuses[] | {context, state, description}]}'
```

Expected: `state: success`, contexto `Vercel` → `Deployment has completed`. (Se `HEAD` não resolver, usar o sha do último commit: `git rev-parse HEAD`.)

- [ ] **Step 4: Verificação HTTP em produção**

```powershell
$url = 'https://radio-06.vercel.app'
(Invoke-WebRequest -Uri ($url + '/') -UseBasicParsing -TimeoutSec 30).StatusCode
$r = Invoke-WebRequest -Uri ($url + '/') -UseBasicParsing -TimeoutSec 30
if ($r.Content -match 'logo_radio_x_transparent\.png') { 'logo remoto: ok' } else { 'logo remoto: FALTA' }
if ($r.Content -match 'rel="icon"') { 'icon remoto: ok' } else { 'icon remoto: FALTA' }
(Invoke-WebRequest -Uri ($url + '/logo/logo_radio_x_transparent.png') -UseBasicParsing -TimeoutSec 30).StatusCode
(Invoke-WebRequest -Uri ($url + '/favicon.ico') -UseBasicParsing -TimeoutSec 30).StatusCode
(Invoke-WebRequest -Uri ($url + '/site.webmanifest') -UseBasicParsing -TimeoutSec 30).StatusCode
```

Expected: `200`, `logo remoto: ok`, `icon remoto: ok`, `200`, `200`, `200`.

- [ ] **Step 5: Resumo ao utilizador**

Registar: logo no header (imagem transparente, sem texto extra), favicon + apple-touch-icon + manifest activos, footer intocado, gates verdes, deploy Vercel confirmado.

---

## Self-Review

- **Spec coverage:** Secção 1 (assets + manifest) → T1; Secção 2 (header) → T2; Secção 3 (favicon head) → T3; Secção 4 (verificação gates/dist/remoto) → T2 Step 3, T3 Step 2, T4 inteira; "fora do âmbito" (footer, admin logo, RAdio_05, tema) respeitado — nenhum task toca esses ficheiros. ✓
- **Placeholder scan:** todos os passos têm comandos/HTML/JSON exactos; sem TBD/TODO; caminhos e mensagens de commit definidos. ✓
- **Type consistency:** `src="/logo/logo_radio_x_transparent.png"` (T1 cria em `public/logo/`, T2 consome no `<img>`, T4 verifica remoto) idêntico em todos; hrefs dos `<link>` (T3) batem com os ficheiros copiados no T1; `alt={d.nome}` usa o `d` já existente no Header. ✓
