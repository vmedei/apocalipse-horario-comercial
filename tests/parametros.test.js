import { describe, expect, it } from 'vitest';
import { lerParametros } from '../src/parametros.js';

describe('lerParametros', () => {
  it('usa valores padrão sem parâmetros', () => {
    expect(lerParametros('')).toEqual({ debug: false, dia: null, seed: null, vel: 1 });
  });

  it('lê combinações válidas', () => {
    expect(lerParametros('?debug&dia=5&seed=7&vel=10')).toEqual({ debug: true, dia: 5, seed: 7, vel: 10 });
  });

  it('ignora valores fora do intervalo ou inválidos', () => {
    expect(lerParametros('?dia=9&vel=abc&seed=-1')).toEqual({ debug: false, dia: null, seed: null, vel: 1 });
  });

  it('aceita ?debug=0 como desligado', () => {
    expect(lerParametros('?debug=0').debug).toBe(false);
  });
});
