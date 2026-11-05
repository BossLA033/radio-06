const FORMATADOR = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Luanda',
});

const FORMATADOR_LONGO = new Intl.DateTimeFormat('pt-PT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Africa/Luanda',
});

export function formatarData(data: Date): string {
  return FORMATADOR.format(data).replace('.', '');
}

export function formatarDataLonga(data: Date): string {
  const texto = FORMATADOR_LONGO.format(data);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
