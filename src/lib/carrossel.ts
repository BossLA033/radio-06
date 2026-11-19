export interface Passo {
  esquerda: number;
  salto: boolean;
}

function indiceActual(offsets: number[], scrollLeft: number): number {
  let actual = 0;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= scrollLeft + 1) actual = i;
    else break;
  }
  return actual;
}

export function proximoOffset(offsets: number[], scrollLeft: number, maximo: number): Passo {
  if (offsets.length === 0) return { esquerda: 0, salto: true };
  const seguinte = indiceActual(offsets, scrollLeft) + 1;
  if (seguinte >= offsets.length || offsets[seguinte] > maximo) {
    return { esquerda: offsets[0], salto: true };
  }
  return { esquerda: offsets[seguinte], salto: false };
}

export function offsetAnterior(offsets: number[], scrollLeft: number, maximo: number): Passo {
  if (offsets.length === 0) return { esquerda: 0, salto: true };
  const actual = indiceActual(offsets, scrollLeft);
  if (actual > 0) return { esquerda: offsets[actual - 1], salto: false };
  for (let i = offsets.length - 1; i >= 0; i--) {
    if (offsets[i] <= maximo) return { esquerda: offsets[i], salto: true };
  }
  return { esquerda: offsets[offsets.length - 1], salto: true };
}
