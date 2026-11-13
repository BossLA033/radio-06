# Rádio 06 — Runbook de operação

Registo do estado operacional a2026-11-09 (sessão de deploy + admin).

## URLs

| O quê | URL |
|---|---|
| Site público (Vercel, CD por push) | https://radio-06.vercel.app |
| Espelho Netlify (host do admin) | https://peppy-figolla-1b3d11.netlify.app |
| Admin (Decap CMS) | https://peppy-figolla-1b3d11.netlify.app/admin/ |
| Repo GitHub | https://github.com/BossLA033/radio-06 (branch `main`) |
| Site Netlify (dashboard) | https://app.netlify.com/projects/peppy-figolla-1b3d11 |

## Acesso ao admin

- Email: `dorme244@gmail.com` (utilizador confirmado no Identity).
- Password: definida em sessão a 2026-11-09 (não é registada aqui).

### Login — formato correcto do pedido

O endpoint `/token` só aceita **form-urlencoded** com a chave **`username`**
(JSON e chave `email` falham com `invalid_grant` genérico):

```
POST https://peppy-figolla-1b3d11.netlify.app/.netlify/identity/token?grant_type=password
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=dorme244%40gmail.com&password=<pw>
```

(O Decap faz isto correctamente; falhas via API quase sempre vêm de JSON/`email`.)

### Password esquecida — recuperação via API

O link de recovery do email cai na **raiz do deploy preview** (sem widget),
por isso conclui-se via API:

1. `POST /.netlify/identity/recover` body `{"email":"dorme244@gmail.com"}` →200.
2. Extrair `#recovery_token=...` do link recebido no email.
3. `POST /.netlify/identity/verify` body `{"token":"<token>","type":"recovery"}` → devolve `access_token`.
4. `PUT /.netlify/identity/user` body `{"password":"<nova>"}` com `Authorization: Bearer <access_token>`.
5. Login com o formato acima.

## Identity — estado final

- `disable_signup: true` (só convites), `autoconfirm: false`.
- Git-gateway activo em `/.netlify/git/github` (repo-scoped: usar paths tipo
  `/contents/...`, `/git/trees/...`, `/branches` — paths `/repos/{owner}/{repo}/...`
  e `/user` são bloqueados por política do Netlify, é normal).
- **Addon git** (`service-slug: git`): `github.repo = BossLA033/radio-06` e
  `github.access_token` = PAT clássico do BossLA033 (scope `repo`, obtido via
  `gh auth token`). Renovar/alterar via:

  ```
  PUT /api/v1/sites/<site_id>/services/git/instances/<git_instance_id>
  {"config":{"github":{"endpoint":"","repo":"BossLA033/radio-06","access_token":"<pat>"},"gitlab":{...},"bitbucket":{...},"roles":null}}
  ```

  **O wrapper `"config"` é obrigatório** — corpo "nú" devolve204 mas não grava.
- Utilizadores: `dorme244@gmail.com` (confirmado), `bidonpequeno@gmail.com`
  (convite pendente desde 2026-11-09 — ignorar ou apagar no dashboard).

## Deploys

- **Vercel**: deploy automático por push (CD verificado). `/admin/` tem `noindex`.
  - Repo **público desde 2026-11-12**: com repo privado + plano Hobby, a Vercel
    bloqueava (`Deployment was blocked`) commits do admin Decap (`dorme244`),
    que não é o dono da equipa Vercel (`bidonpequeno`). Tornar o repo público
    remove essa verificação de autor — publicações do admin voltam a disparar
    deploy na hora. Verificado a 2026-11-13 com commit `7d8cfa7` (`dorme244`):
    status Vercel `success` em ~15 s. Nota: o commit `736b93d` (empurrado
    exactamente na mudança de visibilidade) perdeu o webhook e nunca recebeu
    status — é normal, não indicativo de falha.
- **Netlify**: créditos esgotados — builds git bloqueados
  (`Skipped due to account credit usage exceeded`).
  - Publicar pelo Decap → commit no GitHub → **Vercel actualiza o site público** ✓.
  - Para actualizar o espelho Netlify quando necessário:
    `netlify deploy --dir=dist` (draft) + `POST /api/v1/deploys/<deploy_id>/restore`
    (promove para produção; `--prod` directo dá403).

## Quirks da API Netlify (aprendidos a hard way)

- `PUT /sites/<id>/identity/<instance>`: o campo `autoconfirm` só é lido do
  **nível de topo** do body (não de `mailer.autoconfirm`) para efeito/setting público.
- `POST/PUT .../services/<addon>/instances`: corpo com wrapper `{"config": {...}}`.
- Signup só nasce confirmado com `autoconfirm` de topo = true; repor a seguir.
- Writes ao utilizador via API admin (`/users/<id>` com password) são stubs —
  usar sempre os endpoints do próprio Identity (`/.netlify/identity/*`).
- Endpoint `/invite` do Identity exige JWT do GoTrue (não o token Netlify);
  convites fazem-se pelo dashboard ou pelo admin API `/users/invite`.
