import { describe, expect, it } from 'vitest';
import {
  DIAS_SEMANA,
  agoraEmLuanda,
  minutos,
  ordenarGrelha,
  proximoSlot,
  slotActual,
  type Slot,
} from './agora';

const GRELHA: Slot[] = [
  { dia: 1, inicio: '07:00', fim: '09:00', programa: 'Manhã Rádio X' },
  { dia: 1, inicio: '12:00', fim: '14:00', programa: 'Almoço Musical' },
  { dia: 1, inicio: '14:00', fim: '16:00', programa: 'Tarde Azul' },
  { dia: 3, inicio: '20:00', fim: '22:00', programa: 'Sessão Noturna' },
];

describe('minutos', () => {
  it('converte HH:MM em minutos do dia', () => {
    expect(minutos('00:00')).toBe(0);
    expect(minutos('07:05')).toBe(425);
    expect(minutos('23:59')).toBe(1439);
  });
});

describe('agoraEmLuanda', () => {
  it('converte UTC para o fuso de Luanda (UTC+1)', () => {
    // 2026-10-26 (segunda) 10:30 UTC -> 11:30 em Luanda
    expect(agoraEmLuanda(new Date('2026-10-26T10:30:00Z'))).toEqual({ dia: 1, minutos: 690 });
  });

  it('vira o dia na meia-noite local', () => {
    // 2026-10-26 23:30 UTC -> 2026-10-27 00:30 em Luanda (terça-feira)
    expect(agoraEmLuanda(new Date('2026-10-26T23:30:00Z'))).toEqual({ dia: 2, minutos: 30 });
  });

  it('identifica o domingo como dia 0', () => {
    // 2026-10-25 (domingo) 08:00 UTC -> 09:00 em Luanda
    expect(agoraEmLuanda(new Date('2026-10-25T08:00:00Z'))).toEqual({ dia: 0, minutos: 540 });
  });

  it('tem nome legível para todos os dias', () => {
    expect(DIAS_SEMANA[1]).toBe('Segunda-feira');
    expect(DIAS_SEMANA).toHaveLength(7);
  });
});

describe('slotActual', () => {
  it('devolve o programa que está no ar', () => {
    expect(slotActual(GRELHA, { dia: 1, minutos: 750 })?.programa).toBe('Almoço Musical');
  });

  it('devolve null fora de horário', () => {
    expect(slotActual(GRELHA, { dia: 1, minutos: 600 })).toBeNull();
  });

  it('inclui o minuto de início e exclui o de fim', () => {
    expect(slotActual(GRELHA, { dia: 1, minutos: 420 })?.programa).toBe('Manhã Rádio X');
    expect(slotActual(GRELHA, { dia: 1, minutos: 540 })).toBeNull();
  });
});

describe('proximoSlot', () => {
  it('devolve o slot que começa a seguir', () => {
    expect(proximoSlot(GRELHA, { dia: 1, minutos: 750 })?.programa).toBe('Tarde Azul');
  });

  it('passa para a semana seguinte quando já não resta nada hoje', () => {
    expect(proximoSlot(GRELHA, { dia: 3, minutos: 1330 })?.programa).toBe('Manhã Rádio X');
  });

  it('devolve null sem grelha', () => {
    expect(proximoSlot([], { dia: 1, minutos: 0 })).toBeNull();
  });
});

describe('ordenarGrelha', () => {
  it('ordena por dia e depois pela hora de início', () => {
    const desordenada = [...GRELHA].reverse();
    const ordenada = ordenarGrelha(desordenada);
    expect(ordenada.map((slot) => `${slot.dia}-${slot.inicio}`)).toEqual([
      '1-07:00',
      '1-12:00',
      '1-14:00',
      '3-20:00',
    ]);
  });
});
