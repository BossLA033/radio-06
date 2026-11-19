import { describe, expect, it } from 'vitest';
import { offsetAnterior, proximoOffset } from './carrossel';

const OFFSETS = [0, 620, 1240, 1860];

describe('proximoOffset', () => {
  it('avança para o item seguinte', () => {
    expect(proximoOffset(OFFSETS, 0, 1240)).toEqual({ esquerda: 620, salto: false });
    expect(proximoOffset(OFFSETS, 620, 1240)).toEqual({ esquerda: 1240, salto: false });
  });

  it('no fim da faixa volta ao início com salto instantâneo', () => {
    expect(proximoOffset(OFFSETS, 1240, 1240)).toEqual({ esquerda: 0, salto: true });
    expect(proximoOffset(OFFSETS, 1860, 1860)).toEqual({ esquerda: 0, salto: true });
  });

  it('quando o próximo item passa do fim da faixa visível, volta ao início', () => {
    expect(proximoOffset([0, 584, 1168, 1752], 1168, 1192)).toEqual({
      esquerda: 0,
      salto: true,
    });
  });

  it('tolera sub-pixels: 619.5 considera alcançado o item em 620', () => {
    expect(proximoOffset(OFFSETS, 619.5, 1240)).toEqual({ esquerda: 1240, salto: false });
  });

  it('sem itens devolve a origem', () => {
    expect(proximoOffset([], 0, 0)).toEqual({ esquerda: 0, salto: true });
  });
});

describe('offsetAnterior', () => {
  it('recua para o item anterior', () => {
    expect(offsetAnterior(OFFSETS, 1240, 1240)).toEqual({ esquerda: 620, salto: false });
    expect(offsetAnterior(OFFSETS, 620, 1240)).toEqual({ esquerda: 0, salto: false });
  });

  it('no início salta para o último estado visível', () => {
    expect(offsetAnterior(OFFSETS, 0, 1240)).toEqual({ esquerda: 1240, salto: true });
  });

  it('de um fim clamped recua para o estado lógico anterior', () => {
    expect(offsetAnterior([0, 584, 1168, 1752], 1192, 1192)).toEqual({
      esquerda: 584,
      salto: false,
    });
  });

  it('sem itens devolve a origem', () => {
    expect(offsetAnterior([], 0, 0)).toEqual({ esquerda: 0, salto: true });
  });
});
