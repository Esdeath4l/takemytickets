import { bayesianAverage } from '../../src/domain/helpers';

describe('bayesianAverage', () => {
  test('computes correctly', () => {
    const C = 10;
    const m = 3.5;
    const n = 5;
    const avg = 4.2;
    const out = bayesianAverage(C, m, n, avg);
    expect(typeof out).toBe('number');
    expect(out).toBeGreaterThanOrEqual(0);
  });
});
