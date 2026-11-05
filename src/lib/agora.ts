export const FUSO = 'Africa/Luanda';

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

export const DIAS_CURTOS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface Slot {
  dia: number;
  inicio: string;
  fim: string;
  programa: string;
}

export interface Instante {
  dia: number;
  minutos: number;
}

const ORDEM_DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function minutos(hora: string): number {
  const [horas, mins] = hora.split(':').map(Number);
  return horas * 60 + mins;
}

export function agoraEmLuanda(agora: Date = new Date()): Instante {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(agora);

  const valores: Record<string, string> = {};
  for (const parte of partes) valores[parte.type] = parte.value;

  const dia = ORDEM_DIAS.indexOf(valores.weekday);
  const hora = Number(valores.hour);
  const minuto = Number(valores.minute);

  return { dia: dia === -1 ? 0 : dia, minutos: hora * 60 + minuto };
}

function absoluta(slot: Slot): number {
  return slot.dia * 1440 + minutos(slot.inicio);
}

export function slotActual(slots: Slot[], instante: Instante): Slot | null {
  const agora = instante.dia * 1440 + instante.minutos;
  for (const slot of slots) {
    const inicio = absoluta(slot);
    const fim = slot.dia * 1440 + minutos(slot.fim);
    if (agora >= inicio && agora < fim) return slot;
  }
  return null;
}

export function proximoSlot(slots: Slot[], instante: Instante): Slot | null {
  if (slots.length === 0) return null;
  const agora = instante.dia * 1440 + instante.minutos;

  let melhor: Slot | null = null;
  let melhorDelta = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const delta = absoluta(slot) - agora;
    const espera = delta > 0 ? delta : delta + 7 * 1440;
    if (espera < melhorDelta) {
      melhorDelta = espera;
      melhor = slot;
    }
  }

  return melhor;
}

export function ordenarGrelha(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => a.dia - b.dia || minutos(a.inicio) - minutos(b.inicio));
}
