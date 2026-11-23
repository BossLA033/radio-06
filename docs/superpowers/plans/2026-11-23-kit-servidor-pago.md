# Kit servidor pago (cópia do RAdio_06) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a pasta `RAdio_06-servidor-pago` (cópia completa do RAdio_06 fora do repo) com `LEIAME-servidor.md` e `actualizar-kit.ps1`, e provar que o kit constrói sozinho (gates a 0).

**Architecture:** Uma cópia via `robocopy` com exclusões de artefactos regeneráveis (`node_modules`, `dist`, `.git`, caches, logs, superpowers), seguida de dois ficheiros novos na raiz do kit (instruções + script de actualização) e verificação final correndo os gates de qualidade dentro da própria pasta nova. O kit fica em disco fora de qualquer repositório git — sem commits dentro dele; o único commit é do plano/spec no repo do RAdio_06.

**Tech Stack:** PowerShell 5.1 (shell do agente), `robocopy` (código 1–7 = sucesso, ≥8 = erro), Node 20+ / npm com lockfile (`npm ci`), gates do projeto: `npm run build`, `npm run check`, `npm run lint`, `npm run test`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-11-23-kit-servidor-pago-design.md` (aprovada).
- **RAdio_06 e RAdio_05 intocados** — nada de alterações a código; só se cria `docs/superpowers/plans/` novo no 06.
- Shell **PowerShell 5.1**: sem `&&`; `robocopy` devolve 1–7 = sucesso (≥8 = falha).
- Origem: `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06`
- Kit (destino): `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago`
- Exclusões exactas: `/XD .git node_modules dist .astro .netlify test-results .superpowers superpowers` + `/XF *.log` (`superpowers` exclui `docs/superpowers`; `docs/OPERACAO.md` fica).
- Commits (só no repo 06, mensagens sem acentos, estilo `docs:`): ao final do plano.
- O kit **não** tem `.git` nem `node_modules` — e nunca deve ter.

---

### Task 1: Criar o kit — cópia integral com exclusões

**Files:**
- Create: pasta `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago\` (cópia do RAdio_06)

**Interfaces:**
- Consumes: nada (primeira task).
- Produces: pasta do kit com `package.json`, `package-lock.json`, `src/`, `content/`, `public/` (inclui `admin/` e `media/`), `tests/`, configs, `README.md`, `docs/OPERACAO.md`; **sem** `.git`, `node_modules`, `dist`, `docs/superpowers`.

- [ ] **Step 1: Copiar com robocopy**

```powershell
$origem = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06'
$destino = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
robocopy $origem $destino /E /XF *.log /XD .git node_modules dist .astro .netlify test-results .superpowers superpowers /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) { "CLONE FALHOU (codigo $LASTEXITCODE)"; exit 1 } else { "copia ok (codigo $LASTEXITCODE)" }
```

Expected: `copia ok (codigo 0..7)`.

- [ ] **Step 2: Verificar inclusões e exclusões**

```powershell
$kit = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
$precisa = @('package.json','package-lock.json','astro.config.mjs','vercel.json','netlify.toml','README.md','src\pages\index.astro','content\settings.json','public\admin\config.yml','docs\OPERACAO.md','tests\smoke.spec.ts')
foreach ($f in $precisa) { $ok = Test-Path (Join-Path $kit $f); "$f : " + $(if ($ok) {'ok'} else {'FALTA'}) }
$proibidos = @('.git','node_modules','dist','docs\superpowers')
foreach ($d in $proibidos) { $existe = Test-Path (Join-Path $kit $d); "$d : " + $(if ($existe) {'ESTA AQUI (mau)'} else {'ausente (bom)'}) }
```

Expected: tudo `ok` / `ausente (bom)`.

---

### Task 2: LEIAME-servidor.md na raiz do kit

**Files:**
- Create: `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago\LEIAME-servidor.md`

**Interfaces:**
- Consumes: Task 1 (pasta do kit existe).
- Produces: instruções completas de deploy em servidor pago (referenciadas pelo utilizador no futuro).

- [ ] **Step 1: Escrever o LEIAME**

Conteúdo exacto do ficheiro:

````markdown
# Pôr o site num servidor pago

Estas instruções são para quando tiveres um servidor (VPS, hosting com SSH, etc.).
O site é estático: não precisa de backend nenhum para funcionar — só para o painel `/admin`.

## 1. Transferir a pasta

Copia toda esta pasta (`RAdio_06-servidor-pago`) para o servidor, ex.:

```bash
scp -r RAdio_06-servidor-pago usuario@servidor:/var/www/radio-06
```

## 2. Construir

```bash
cd /var/www/radio-06
npm ci          # instala dependências exactas do package-lock.json
npm run build   # gera o site em dist/
```

Se o servidor não tiver Node: instala a versão 20+ (`node -v`).

## 3. Servir o dist/

Opção A — nginx (apontar o `root` do site para `dist/`):

```nginx
server {
  listen 80;
  server_name o-teu-dominio;
  root /var/www/radio-06/dist;
  index index.html;
  location / { try_files $uri $uri/ /404.html; }
}
```

Opção B — rápido para testar:

```bash
npx serve dist
```

## 4. Actualizar o site mais tarde

Quando o RAdio_06 mudar na tua máquina Windows, corre na raiz desta pasta:

```powershell
.\actualizar-kit.ps1
```

e depois repete o passo 2 (`npm ci && npm run build`) no servidor.

## 5. AVISO — o painel /admin

O `/admin` (Decap CMS) precisa de um **backend git** para gravar alterações.
No setup actual (Netlify) usa Netlify Identity + Git Gateway — ver `docs/OPERACAO.md`.
Num servidor pago tens de escolher uma destas:

- **GitHub backend** do Decap: criar um OAuth App no GitHub e mudar `backend` em `public/admin/config.yml` (`backend: github` + `repo:`)
- **Continuar a usar o Netlify** só para o admin (site de lá em `/admin/`, Identity activo)

Sem um destes, o `/admin` abre mas o login não funciona.

O `/admin` está marcado com `X-Robots-Tag: noindex, nofollow` (não aparece nos motores de busca).
````

- [ ] **Step 2: Verificar o ficheiro**

```powershell
$kit = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
$p = Join-Path $kit 'LEIAME-servidor.md'
if (-not (Test-Path $p)) { 'LEIAME FALTA'; exit 1 }
$conteudo = Get-Content $p -Raw
'leia: ' + $(if ($conteudo -match 'npm ci') {'ok'} else {'FALTA npm ci'})
'admin: ' + $(if ($conteudo -match '/admin') {'ok'} else {'FALTA admin'})
'actualizar: ' + $(if ($conteudo -match 'actualizar-kit.ps1') {'ok'} else {'FALTA script'})
```

Expected: tudo `ok`.

---

### Task 3: actualizar-kit.ps1 na raiz do kit

**Files:**
- Create: `C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago\actualizar-kit.ps1`

**Interfaces:**
- Consumes: Task 1 (mesmas exclusões).
- Produces: script reutilizável que re-copia o RAdio_06 para o kit sem apagar `LEIAME-servidor.md` nem o próprio script.

- [ ] **Step 1: Escrever o script**

Conteúdo exacto de `actualizar-kit.ps1`:

```powershell
# Actualiza este kit a partir do RAdio_06 (correr numa maquina com o projecto em C:\Users\breno\Documents\Antigraviti_texte\RAdio_06)
$origem = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06'
$destino = Split-Path -Parent $MyInvocation.MyCommand.Path

robocopy $origem $destino /E /XF *.log /XD .git node_modules dist .astro .netlify test-results .superpowers superpowers /NFL /NDL /NJH /NJS
if ($LASTEXITCODE -ge 8) {
  Write-Host "ACTUALIZACAO FALHOU (codigo $LASTEXITCODE)"
  exit 1
}
Write-Host "kit actualizado (codigo $LASTEXITCODE = sucesso)"
```

Nota: usa `/E` (sem `/MIR`) para nunca apagar `LEIAME-servidor.md` nem o próprio script.

- [ ] **Step 2: Correr o script para o testar**

```powershell
& 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago\actualizar-kit.ps1'
```

Expected: `kit actualizado (codigo ... = sucesso)`.

- [ ] **Step 3: Verificar que nada desapareceu**

```powershell
$kit = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
'leia: ' + $(if (Test-Path (Join-Path $kit 'LEIAME-servidor.md')) {'ok'} else {'FALTA'})
'script: ' + $(if (Test-Path (Join-Path $kit 'actualizar-kit.ps1')) {'ok'} else {'FALTA'})
'sem .git: ' + $(if (Test-Path (Join-Path $kit '.git')) {'MAU'} else {'ok'})
'sem node_modules: ' + $(if (Test-Path (Join-Path $kit 'node_modules')) {'MAU'} else {'ok'})
```

Expected: `ok` em tudo.

---

### Task 4: Gates dentro do kit (prova que constrói sozinho)

**Files:**
- Nenhum (verificação; npm cria `node_modules/` e `dist/` dentro do kit — **esperado só nesta task**, para teste; ver Step 3).

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: evidência de que `npm ci` + os 4 gates correm a 0 dentro da pasta nova.

- [ ] **Step 1: Instalar dependências no kit**

```powershell
Set-Location 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
npm ci
if ($LASTEXITCODE -ne 0) { 'NPM CI FALHOU'; exit 1 }
'npm ci ok'
```

Expected: `npm ci ok` (demora uns minutos; usa timeout de 600000 ms).

- [ ] **Step 2: Correr os 4 gates**

```powershell
Set-Location 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
npm run build 2>$null | Select-Object -Last 1; if ($LASTEXITCODE -ne 0) { 'BUILD FALHOU'; exit 1 }
npm run check 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'CHECK FALHOU'; exit 1 }
npm run lint; if ($LASTEXITCODE -ne 0) { 'LINT FALHOU'; exit 1 }
npm run test 2>$null | Select-Object -Last 3; if ($LASTEXITCODE -ne 0) { 'TEST FALHOU'; exit 1 }
'GATES VERDES NO KIT'
```

Expected: `GATES VERDES NO KIT`.

- [ ] **Step 3: Limpar artefactos de teste do kit**

O kit final **não** deve levar `node_modules/`, `dist/` nem `.astro/` (são regeneráveis no servidor com `npm ci` + `npm run build`).

```powershell
$kit = 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06-servidor-pago'
foreach ($d in @('node_modules','dist','.astro')) { $p = Join-Path $kit $d; if (Test-Path $p) { Remove-Item -Recurse -Force $p; "$d removido" } else { "$d inexistente" } }
'sem node_modules: ' + $(if (Test-Path (Join-Path $kit 'node_modules')) {'MAU'} else {'ok'})
'sem dist: ' + $(if (Test-Path (Join-Path $kit 'dist')) {'MAU'} else {'ok'})
```

Expected: `removido`/`inexistente` e `ok` no fim.

---

### Task 5: Commit do plano no repo 06

**Files:**
- Modify: `docs/superpowers/plans/2026-11-23-kit-servidor-pago.md` (este ficheiro)

**Interfaces:**
- Consumes: Tasks 1–4 concluídas.
- Produces: plano commitado em `RAdio_06` (`docs:` sem acentos).

- [ ] **Step 1: Marcar checkboxes e commitar**

```powershell
Set-Location 'C:\Users\breno\Documents\Antigraviti_texte\RAdio_06'
git add docs/superpowers/plans/2026-11-23-kit-servidor-pago.md
git commit -m "docs: plano do kit servidor pago"
git push
```

Expected: push aceite (`## main...origin/main`).
