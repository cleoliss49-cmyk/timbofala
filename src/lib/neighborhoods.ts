export const TIMBO_NEIGHBORHOODS = [
  'Araponguinhas',
  'Bairro das Capitais',
  'Centro',
  'Dona Clara',
  'Estados',
  'Fritz Lorenz',
  'Imigrantes',
  'Mulde',
  'Nações',
  'Padre Martinho Stein',
  'Pomeranos',
  'Quintino',
  'São Roque',
  'Tiroleses',
  'Tifa Nardelli',
  'Vila Germer',
] as const;

export const NEIGHBORHOODS = TIMBO_NEIGHBORHOODS;

export type TimboNeighborhood = typeof TIMBO_NEIGHBORHOODS[number];
