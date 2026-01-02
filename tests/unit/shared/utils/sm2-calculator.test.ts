/**
 * Unit Tests for SM-2 Algorithm Calculator Utility
 * Pure function tests for SM-2 calculations
 */

/**
 * SM-2 Algorithm Calculator (Pure Function)
 * Based on API Plan specification
 */
function calculateSM2(
  rating: 'again' | 'hard' | 'good' | 'easy',
  currentEF: number,
  currentN: number,
  currentInterval: number
): { ef: number; n: number; interval: number } {
  let ef = currentEF;
  let n = currentN;
  let interval = currentInterval;

  switch (rating) {
    case 'again':
      n = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
      break;
    case 'hard':
      interval = Math.ceil(interval * 1.2);
      if (interval === 0) interval = 1;
      ef = Math.max(1.3, ef - 0.15);
      break;
    case 'good':
      if (n === 0) interval = 1;
      else if (n === 1) interval = 6;
      else interval = Math.ceil(interval * ef);
      n += 1;
      break;
    case 'easy':
      n += 1;
      if (n === 1) interval = 1;
      else if (n === 2) interval = 6;
      else {
        interval = Math.ceil(interval * ef);
        interval = Math.ceil(interval * 1.3);
      }
      ef += 0.15;
      break;
  }

  return { ef, n, interval };
}

describe('SM-2 Calculator Utility', () => {
  describe('Rating: Again', () => {
    it('should reset card completely', () => {
      const result = calculateSM2('again', 2.5, 5, 15);

      expect(result.n).toBe(0);
      expect(result.interval).toBe(1);
      expect(result.ef).toBeLessThan(2.5);
    });

    it('should decrease EF by 0.2', () => {
      const result = calculateSM2('again', 2.5, 0, 0);

      expect(result.ef).toBeCloseTo(2.3, 1);
    });

    it('should enforce minimum EF of 1.3', () => {
      const result = calculateSM2('again', 1.3, 0, 0);

      expect(result.ef).toBe(1.3);
    });

    it('should enforce minimum EF even when calculation goes below', () => {
      const result = calculateSM2('again', 1.4, 0, 0);

      expect(result.ef).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe('Rating: Hard', () => {
    it('should multiply interval by 1.2', () => {
      const result = calculateSM2('hard', 2.5, 2, 10);

      expect(result.interval).toBe(Math.ceil(10 * 1.2)); // 12
    });

    it('should handle zero interval', () => {
      const result = calculateSM2('hard', 2.5, 0, 0);

      expect(result.interval).toBe(1);
    });

    it('should decrease EF by 0.15', () => {
      const result = calculateSM2('hard', 2.5, 2, 10);

      expect(result.ef).toBeCloseTo(2.35, 1);
    });

    it('should enforce minimum EF of 1.3', () => {
      const result = calculateSM2('hard', 1.4, 2, 10);

      expect(result.ef).toBeGreaterThanOrEqual(1.3);
    });

    it('should not change repetition count', () => {
      const result = calculateSM2('hard', 2.5, 3, 10);

      expect(result.n).toBe(3);
    });
  });

  describe('Rating: Good', () => {
    it('should set interval to 1 for first repetition (n=0)', () => {
      const result = calculateSM2('good', 2.5, 0, 0);

      expect(result.interval).toBe(1);
      expect(result.n).toBe(1);
    });

    it('should set interval to 6 for second repetition (n=1)', () => {
      const result = calculateSM2('good', 2.5, 1, 1);

      expect(result.interval).toBe(6);
      expect(result.n).toBe(2);
    });

    it('should multiply by EF for subsequent repetitions', () => {
      const ef = 2.5;
      const result = calculateSM2('good', ef, 2, 6);

      expect(result.interval).toBe(Math.ceil(6 * ef)); // 15
      expect(result.n).toBe(3);
    });

    it('should not change EF', () => {
      const result = calculateSM2('good', 2.5, 2, 6);

      expect(result.ef).toBe(2.5);
    });

    it('should increment repetition count', () => {
      const result = calculateSM2('good', 2.5, 5, 15);

      expect(result.n).toBe(6);
    });
  });

  describe('Rating: Easy', () => {
    it('should set interval to 1 for first repetition (n=0)', () => {
      const result = calculateSM2('easy', 2.5, 0, 0);

      expect(result.interval).toBe(1);
      expect(result.n).toBe(1);
    });

    it('should set interval to 6 for second repetition (n=1)', () => {
      const result = calculateSM2('easy', 2.5, 1, 1);

      expect(result.interval).toBe(6);
      expect(result.n).toBe(2);
    });

    it('should multiply by EF and then by 1.3 for subsequent repetitions', () => {
      const ef = 2.5;
      const result = calculateSM2('easy', ef, 2, 6);

      const expectedInterval = Math.ceil(Math.ceil(6 * ef) * 1.3); // ceil(ceil(15) * 1.3) = 20
      expect(result.interval).toBe(expectedInterval);
      expect(result.n).toBe(3);
    });

    it('should increase EF by 0.15', () => {
      const result = calculateSM2('easy', 2.5, 2, 6);

      expect(result.ef).toBeCloseTo(2.65, 1);
    });

    it('should increment repetition count', () => {
      const result = calculateSM2('easy', 2.5, 5, 15);

      expect(result.n).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high EF values', () => {
      const result = calculateSM2('good', 5.0, 3, 10);

      expect(result.interval).toBe(Math.ceil(10 * 5.0));
      expect(result.ef).toBe(5.0);
    });

    it('should handle very low EF values', () => {
      const result = calculateSM2('good', 1.3, 3, 10);

      expect(result.interval).toBe(Math.ceil(10 * 1.3));
      expect(result.ef).toBe(1.3);
    });

    it('should handle very high repetition count', () => {
      const result = calculateSM2('good', 2.5, 100, 1000);

      expect(result.n).toBe(101);
      expect(result.interval).toBe(Math.ceil(1000 * 2.5));
    });

    it('should round intervals up (ceiling)', () => {
      const result = calculateSM2('good', 2.3, 2, 7);

      // 7 * 2.3 = 16.1, should ceil to 17
      expect(result.interval).toBe(Math.ceil(7 * 2.3));
    });
  });

  describe('Consistency Tests', () => {
    it('should produce deterministic results', () => {
      const result1 = calculateSM2('good', 2.5, 2, 6);
      const result2 = calculateSM2('good', 2.5, 2, 6);

      expect(result1).toEqual(result2);
    });

    it('should maintain EF within reasonable bounds over many reviews', () => {
      let ef = 2.5;
      let n = 0;
      let interval = 0;

      // Simulate 10 "again" reviews
      for (let i = 0; i < 10; i++) {
        const result = calculateSM2('again', ef, n, interval);
        ef = result.ef;
        n = result.n;
        interval = result.interval;
      }

      expect(ef).toBeGreaterThanOrEqual(1.3);
      expect(ef).toBeLessThanOrEqual(2.5);
    });

    it('should allow EF to grow with "easy" ratings', () => {
      let ef = 2.5;
      let n = 0;
      let interval = 0;

      // Simulate 5 "easy" reviews
      for (let i = 0; i < 5; i++) {
        const result = calculateSM2('easy', ef, n, interval);
        ef = result.ef;
        n = result.n;
        interval = result.interval;
      }

      expect(ef).toBeGreaterThan(2.5);
    });
  });
});
