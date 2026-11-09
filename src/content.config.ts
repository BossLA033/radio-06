import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const eUrl = (valor: string): boolean => {
  try {
    new URL(valor);
    return true;
  } catch {
    return false;
  }
};

const URL_ = z.string().refine(eUrl, 'URL inválida (tem de começar por http:// ou https://)');
const EMAIL = z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email inválido');
const HORA = z.string().regex(/^\d{2}:\d{2}$/, 'hora no formato HH:MM (ex.: 08:30)');
const IMAGEM = z
  .string()
  .refine((v) => v.startsWith('/media/') || eUrl(v), 'caminho /media/ficheiro.jpg ou URL http(s)');
const RASCUNHO = z.boolean().default(false);
const LISTA_STRINGS = z.array(z.string().min(1)).default([]);

const definicoes = defineCollection({
  loader: glob({ base: './content', pattern: 'settings.json' }),
  schema: z.object({
    nome: z.string().min(1),
    slogan: z.string().min(1),
    frequencia: z.string().min(1),
    urlStream: URL_,
    email: EMAIL,
    morada: z.string().optional(),
    redes: z.array(z.object({ nome: z.string().min(1), url: URL_ })).default([]),
  }),
});

const grelha = defineCollection({
  loader: glob({ base: './content', pattern: 'grelha.json' }),
  schema: z.object({
    slots: z
      .array(
        z.object({
          dia: z.number().int().min(0).max(6),
          inicio: HORA,
          fim: HORA,
          programa: z.string().min(1),
        }),
      )
      .default([]),
  }),
});

const hero = defineCollection({
  loader: glob({ base: './content/home', pattern: 'hero.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    titulo: z.string().min(1),
    subtitulo: z.string().min(1),
    imagem: IMAGEM.optional(),
    video: URL_.optional(),
    botao: z.object({ texto: z.string().min(1), href: z.string().min(1) }).optional(),
  }),
});

const banners = defineCollection({
  loader: glob({ base: './content/home', pattern: 'banners.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    itens: z
      .array(
        z.object({
          texto: z.string().min(1),
          cta: z.string().min(1).optional(),
          href: z.string().min(1).optional(),
        }),
      )
      .default([]),
  }),
});

const topx = defineCollection({
  loader: glob({ base: './content/home', pattern: 'topx.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    titulo: z.string().min(1),
    itens: z
      .array(
        z.object({
          pos: z.number().int().min(1),
          texto: z.string().min(1),
          imagem: IMAGEM.optional(),
          href: z.string().min(1).optional(),
        }),
      )
      .default([]),
  }),
});

const destaques = defineCollection({
  loader: glob({ base: './content/home', pattern: 'destaques.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    titulo: z.string().min(1),
    itens: z
      .array(
        z.object({
          titulo: z.string().min(1),
          resumo: z.string().min(1),
          tag: z.string().min(1).optional(),
          imagem: IMAGEM.optional(),
          href: z.string().min(1).optional(),
        }),
      )
      .default([]),
  }),
});

const noticias = defineCollection({
  loader: glob({ base: './content/noticias', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string().min(1),
    data: z.coerce.date(),
    tag: z.string().min(1),
    resumo: z.string().optional(),
    capa: IMAGEM.optional(),
    link: URL_.optional(),
    rascunho: RASCUNHO,
  }),
});

const programas = defineCollection({
  loader: glob({ base: './content/programas', pattern: '**/*.json' }),
  schema: z.object({
    nome: z.string().min(1),
    horario: z.string().min(1),
    descricao: z.string().min(1),
    imagem: IMAGEM.optional(),
    apresentadores: LISTA_STRINGS,
    podcast: z.string().min(1).optional(),
    rascunho: RASCUNHO,
  }),
});

const podcasts = defineCollection({
  loader: glob({ base: './content/podcasts', pattern: '**/*.json' }),
  schema: z.object({
    titulo: z.string().min(1),
    descricao: z.string().min(1),
    imagem: IMAGEM.optional(),
    episodios: z
      .array(
        z.object({
          titulo: z.string().min(1),
          audio: URL_,
          duracao: z.string().min(1),
          data: z.coerce.date(),
          rascunho: RASCUNHO,
        }),
      )
      .default([]),
  }),
});

const apresentadores = defineCollection({
  loader: glob({ base: './content/apresentadores', pattern: '**/*.json' }),
  schema: z.object({
    nome: z.string().min(1),
    foto: IMAGEM.optional(),
    bio: z.string().min(1),
    programas: LISTA_STRINGS,
  }),
});

const eventos = defineCollection({
  loader: glob({ base: './content/eventos', pattern: '**/*.json' }),
  schema: z.object({
    titulo: z.string().min(1),
    data: z.coerce.date(),
    local: z.string().min(1),
    descricao: z.string().min(1),
    imagem: IMAGEM.optional(),
    link: URL_.optional(),
    rascunho: RASCUNHO,
  }),
});

const patrocinadores = defineCollection({
  loader: glob({ base: './content/patrocinadores', pattern: '**/*.json' }),
  schema: z.object({
    nome: z.string().min(1),
    logo: IMAGEM.optional(),
    link: URL_.optional(),
  }),
});

const videos = defineCollection({
  loader: glob({ base: './content/videos', pattern: '**/*.json' }),
  schema: z
    .object({
      titulo: z.string().min(1),
      thumb: IMAGEM.optional(),
      origem: z.enum(['youtube', 'ficheiro']),
      url: URL_,
    })
    .superRefine((valor, contexto) => {
      if (valor.origem === 'youtube' && !/(youtube\.com|youtu\.be)/.test(valor.url)) {
        contexto.addIssue({
          code: 'custom',
          path: ['url'],
          message: 'com origem "youtube" o url tem de ser de youtube.com ou youtu.be',
        });
      }
    }),
});

const paginas = defineCollection({
  loader: glob({ base: './content/paginas', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string().min(1),
    rascunho: RASCUNHO,
  }),
});

const passou = defineCollection({
  loader: glob({ base: './content', pattern: 'passou.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    itens: z
      .array(
        z.object({
          hora: HORA,
          artista: z.string().min(1),
          musica: z.string().min(1),
        }),
      )
      .default([]),
  }),
});

const homenagens = defineCollection({
  loader: glob({ base: './content', pattern: 'homenagens.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    itens: z
      .array(
        z.object({
          titulo: z.string().min(1),
          artista: z.string().min(1).optional(),
          imagem: IMAGEM.optional(),
          href: z.string().min(1).optional(),
        }),
      )
      .default([]),
  }),
});

const publicidade = defineCollection({
  loader: glob({ base: './content', pattern: 'publicidade.json' }),
  schema: z.object({
    rascunho: RASCUNHO,
    itens: z
      .array(
        z.object({
          texto: z.string().min(1),
          href: z.string().min(1).optional(),
          imagem: IMAGEM.optional(),
        }),
      )
      .default([]),
  }),
});

export const collections = {
  definicoes,
  grelha,
  hero,
  banners,
  topx,
  destaques,
  noticias,
  programas,
  podcasts,
  apresentadores,
  eventos,
  patrocinadores,
  videos,
  paginas,
  passou,
  homenagens,
  publicidade,
};
