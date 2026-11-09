# Rádio X — site estático

Site 100% estático da Rádio X: Astro 5 + Tailwind 4, conteúdo em ficheiros no repositório e painel de edição em `/admin` (Decap CMS). Sem base de dados, sem servidor.

## Comandos

```bash
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento (http://localhost:4321)
npm run build      # gera o site em dist/
npm run preview    # serve o build localmente
npm run check      # tipagem Astro + conteúdos
npm run lint       # ESLint
npm run test       # testes (Vitest)
```

Gates de qualidade: `npm run build`, `npm run check`, `npm run lint` e `npm run test` têm de sair com código 0 antes de commitar.

## Estrutura

```
content/            fonte da verdade do conteúdo (editada no painel)
  settings.json     identidade da rádio (nome, slogan, stream, redes)
  grelha.json       programação semanal
  home/             hero, banners, topx, destaques da homepage
  noticias/*.md     notícias (markdown)
  programas/        programas da grelha
  podcasts/         séries de podcast com episódios
  apresentadores/   equipa
  eventos/          agenda
  patrocinadores/   marcas
  videos/           vídeos (YouTube ou ficheiro)
  paginas/*.md      páginas livres (ex.: sobre)
public/admin/       Decap CMS (index.html + config.yml)
public/media/       imagens carregadas no painel
src/content.config.ts  schemas Zod de cada coleção (validados no build)
src/lib/agora.ts       lógica do fuso horário (Africa/Luanda)
src/pages/             rotas do site
```

## Conteúdo e rascunhos

- Cada entrada pode ter `rascunho: true`; os rascunhos **não** aparecem no site publicado.
- O slug de uma entrada é o nome do ficheiro (ex.: `content/noticias/entrevista-x.md` → `/noticias/entrevista-x/`).
- Se um campo inválido entrar (hora fora de `HH:MM`, URL sem `http`), o `npm run build` falha — o site não publica conteúdo errado.
- Com as coleções vazias o build avisa (`No files found`, `collection does not exist`); são avisos, não erros, e desaparecem quando existir conteúdo.

## Painel em /admin

1. O conteúdo fica no Git; por isso o painel só funciona com o repositório no GitHub/GitLab + Netlify Identity ativo.
2. No Netlify: **Site settings → Identity → Enable Identity → Invite user**.
3. **Identity → Services → Git Gateway → Enable**.
4. Abre `https://o-teu-site.netlify.app/admin/`, entra com o email convidado e edita.
5. Cada gravação faz um commit e o Netlify volta a construir o site automaticamente.

Localmente (`npm run dev`) o `/admin/` abre, mas o login Netlify não funciona sem repositório remoto.

## Deploy no Netlify

1. Publica o repositório (GitHub) e cria o site no Netlify a partir dele.
2. `netlify.toml` já define `command = "npm run build"`, `publish = "dist"` e `NODE_VERSION = 24`.
3. Liga o Identity e o Git Gateway (passos acima).
4. O formulário de `/contactos/` usa Netlify Forms: aparece em **Forms** no painel do Netlify depois do primeiro envio.

## Notas de implementação

- **Fuso horário**: toda a lógica de "no ar agora" usa `Africa/Luanda` (UTC+1), calculada no browser.
- **Player**: barra fixa em baixo, persistente entre páginas; sem `urlStream` nas Definições o botão fica desativado com aviso "Emissão por configurar".
- **Imagens**: as imagens carregadas no painel ficam em `public/media/` e são servidas tal como estão (não passam pelo otimizador do Astro). Para otimizar, as imagens teriam de viver em `src/assets/`.
- **Vídeos YouTube**: se não houver miniatura, é usada a `https://i.ytimg.com/vi/<id>/hqdefault.jpg`.
- Nenhum segredo no repositório; o site não usa variáveis de ambiente.

## Especificação

O contrato de conteúdo e design está em
`docs/superpowers/specs/2026-10-26-radio-x-estatico-design.md`.

## Deploy

Vercel: https://radio-06.vercel.app (producao, CD por push)
