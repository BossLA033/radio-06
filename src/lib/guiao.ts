import type { Slot } from './agora';

export interface ProgramaResumo {
  id: string;
  nome: string;
}

export interface DadosDoSite {
  grelha: Slot[];
  fuso: string;
  programas: ProgramaResumo[];
}

const VAZIO: DadosDoSite = { grelha: [], fuso: 'Africa/Luanda', programas: [] };

export function lerDados(): DadosDoSite {
  const guiao = document.querySelector('#dados-do-site script');
  if (!guiao?.textContent) return VAZIO;
  try {
    const dados = JSON.parse(guiao.textContent) as Partial<DadosDoSite>;
    return {
      grelha: dados.grelha ?? [],
      fuso: dados.fuso ?? 'Africa/Luanda',
      programas: dados.programas ?? [],
    };
  } catch {
    return VAZIO;
  }
}

export function listarGrelha(): Slot[] {
  return lerDados().grelha;
}

export function nomePrograma(id: string, programas: ProgramaResumo[] = lerDados().programas): string {
  return programas.find((programa) => programa.id === id)?.nome ?? id;
}
