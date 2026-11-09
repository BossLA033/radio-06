import { getCollection, getEntry } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export const DEFINICOES_PADRAO = {
  nome: 'Rádio X',
  slogan: 'Mais que Ouvir, Sentir',
  frequencia: '90.3 FM',
  urlStream: '',
  email: 'geral@radiox.pt',
  morada: '',
  redes: [] as { nome: string; url: string }[],
};

export type Definicoes = typeof DEFINICOES_PADRAO;

export async function definicoes(): Promise<Definicoes> {
  const entrada = await getEntry('definicoes', 'settings');
  if (!entrada) return DEFINICOES_PADRAO;
  return {
    ...DEFINICOES_PADRAO,
    ...entrada.data,
    morada: entrada.data.morada ?? '',
    redes: entrada.data.redes ?? [],
  };
}

type ComRascunho = { data: { rascunho?: boolean } };

export function semRascunho<T extends ComRascunho>(entradas: T[]): T[] {
  return entradas.filter((entrada) => entrada.data.rascunho !== true);
}

export async function noticiasPublicadas(): Promise<CollectionEntry<'noticias'>[]> {
  const todas = await getCollection('noticias');
  return semRascunho(todas).sort((a, b) => b.data.data.valueOf() - a.data.data.valueOf());
}

export async function eventosPublicados(): Promise<CollectionEntry<'eventos'>[]> {
  const todos = await getCollection('eventos');
  return semRascunho(todos).sort((a, b) => a.data.data.valueOf() - b.data.data.valueOf());
}

export async function programasVisiveis(): Promise<CollectionEntry<'programas'>[]> {
  const todos = await getCollection('programas');
  return semRascunho(todos).sort((a, b) => a.data.nome.localeCompare(b.data.nome, 'pt'));
}

export async function paginasVisiveis(): Promise<CollectionEntry<'paginas'>[]> {
  const todas = await getCollection('paginas');
  return semRascunho(todas);
}

export interface Slot {
  dia: number;
  inicio: string;
  fim: string;
  programa: string;
}

export async function slots(): Promise<Slot[]> {
  const grelha = await getEntry('grelha', 'grelha');
  if (!grelha) return [];
  return [...grelha.data.slots].sort((a, b) => a.dia - b.dia || a.inicio.localeCompare(b.inicio));
}

export function episodiosPublicos(serie: CollectionEntry<'podcasts'>) {
  return serie.data.episodios
    .filter((episodio) => episodio.rascunho !== true)
    .sort((a, b) => b.data.valueOf() - a.data.valueOf());
}

export async function heroPublicado() {
  const entrada = await getEntry('hero', 'hero');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function bannersPublicados() {
  const entrada = await getEntry('banners', 'banners');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function topxPublicado() {
  const entrada = await getEntry('topx', 'topx');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function destaquesPublicados() {
  const entrada = await getEntry('destaques', 'destaques');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function videosPublicados() {
  const todos = await getCollection('videos');
  return [...todos].sort((a, b) => a.data.titulo.localeCompare(b.data.titulo, 'pt'));
}

export async function patrocinadoresPublicados() {
  const todos = await getCollection('patrocinadores');
  return [...todos].sort((a, b) => a.data.nome.localeCompare(b.data.nome, 'pt'));
}

export async function podcastsPublicos() {
  const todas = await getCollection('podcasts');
  return todas
    .map((serie) => ({ serie, episodios: episodiosPublicos(serie) }))
    .filter((linha) => linha.episodios.length > 0);
}

export async function apresentadoresTodos() {
  const todos = await getCollection('apresentadores');
  return [...todos].sort((a, b) => a.data.nome.localeCompare(b.data.nome, 'pt'));
}

export async function passouPublicado() {
  const entrada = await getEntry('passou', 'passou');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function homenagensPublicadas() {
  const entrada = await getEntry('homenagens', 'homenagens');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}

export async function publicidadePublicada() {
  const entrada = await getEntry('publicidade', 'publicidade');
  if (!entrada || entrada.data.rascunho) return null;
  return entrada.data;
}
