/**
 * Unit Tests for Edit Percentage Calculator
 * Tests the algorithm for calculating how much a flashcard was edited
 */

/**
 * Calculate edit percentage using Levenshtein distance
 */
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

function calculateEditPercentage(original: string, edited: string): number {
  if (original === edited) return 0;
  if (original.length === 0) return 100;

  const distance = calculateLevenshteinDistance(original, edited);
  const maxLength = Math.max(original.length, edited.length);
  const percentage = (distance / maxLength) * 100;

  return Math.min(100, Math.round(percentage * 100) / 100);
}

function calculateTotalEditPercentage(
  originalQ: string,
  editedQ: string,
  originalA: string,
  editedA: string
): number {
  const qEdit = calculateEditPercentage(originalQ, editedQ);
  const aEdit = calculateEditPercentage(originalA, editedA);
  return (qEdit + aEdit) / 2;
}

describe('Edit Percentage Calculator', () => {
  describe('Levenshtein Distance', () => {
    it('should return 0 for identical strings', () => {
      const distance = calculateLevenshteinDistance('hello', 'hello');
      expect(distance).toBe(0);
    });

    it('should calculate insertions', () => {
      const distance = calculateLevenshteinDistance('cat', 'cats');
      expect(distance).toBe(1);
    });

    it('should calculate deletions', () => {
      const distance = calculateLevenshteinDistance('cats', 'cat');
      expect(distance).toBe(1);
    });

    it('should calculate substitutions', () => {
      const distance = calculateLevenshteinDistance('cat', 'bat');
      expect(distance).toBe(1);
    });

    it('should handle empty strings', () => {
      const distance = calculateLevenshteinDistance('', 'hello');
      expect(distance).toBe(5);
    });

    it('should calculate complex changes', () => {
      const distance = calculateLevenshteinDistance('kitten', 'sitting');
      expect(distance).toBe(3);
    });
  });

  describe('Single String Edit Percentage', () => {
    it('should return 0% for identical strings', () => {
      const percentage = calculateEditPercentage('hello world', 'hello world');
      expect(percentage).toBe(0);
    });

    it('should return 100% for completely different strings', () => {
      const percentage = calculateEditPercentage('abc', 'xyz');
      expect(percentage).toBeCloseTo(100, 0);
    });

    it('should calculate small changes', () => {
      const percentage = calculateEditPercentage(
        'What is the capital?',
        'What is the capital of France?'
      );
      expect(percentage).toBeLessThan(50);
    });

    it('should handle empty original string', () => {
      const percentage = calculateEditPercentage('', 'new text');
      expect(percentage).toBe(100);
    });

    it('should calculate percentage for minor typo fix', () => {
      const percentage = calculateEditPercentage('helo', 'hello');
      // 1 character change out of 5 = 20%
      expect(percentage).toBeLessThan(25);
    });
  });

  describe('Combined Question and Answer Edit Percentage', () => {
    it('should return 0% for no changes', () => {
      const percentage = calculateTotalEditPercentage(
        'Question?',
        'Question?',
        'Answer.',
        'Answer.'
      );
      expect(percentage).toBe(0);
    });

    it('should average question and answer changes', () => {
      // Question: 0% change
      // Answer: 100% change
      // Average: 50%
      const percentage = calculateTotalEditPercentage(
        'Question?',
        'Question?',
        'Original answer',
        'Completely different answer'
      );
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });

    it('should detect minor edits (< 30% threshold)', () => {
      const percentage = calculateTotalEditPercentage(
        'What is the capital of France?',
        'What is the capital of France?',
        'Paris',
        'Paris.'
      );
      // Minor addition to answer (just a period)
      expect(percentage).toBeLessThan(30);
    });

    it('should detect major edits (>= 30% threshold)', () => {
      const percentage = calculateTotalEditPercentage(
        'What is 2+2?',
        'Explain the theory of relativity',
        '4',
        "Einstein's theory describes spacetime"
      );
      expect(percentage).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Acceptance Threshold (FR-AI-020, FR-AI-021)', () => {
    it('should classify unmodified cards as accepted', () => {
      const percentage = calculateTotalEditPercentage('Question', 'Question', 'Answer', 'Answer');
      expect(percentage < 30).toBe(true);
    });

    it('should classify minimally edited cards as accepted', () => {
      const percentage = calculateTotalEditPercentage(
        'What is the capital of France?',
        'What is the capital of France?',
        'Paris',
        'Paris.'
      );
      expect(percentage < 30).toBe(true);
    });

    it('should classify heavily edited cards as not accepted', () => {
      const percentage = calculateTotalEditPercentage(
        'Original question about biology',
        'Completely rewritten question about physics',
        'Original answer',
        'Completely rewritten answer'
      );
      expect(percentage >= 30).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const percentage = calculateEditPercentage(longString, longString);
      expect(percentage).toBe(0);
    });

    it('should handle unicode characters', () => {
      const percentage = calculateEditPercentage('hello 世界', 'hello world');
      expect(percentage).toBeGreaterThan(0);
    });

    it('should handle newlines and special characters', () => {
      const percentage = calculateEditPercentage('Line 1\nLine 2', 'Line 1\nModified Line 2');
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });

    it('should round to 2 decimal places', () => {
      const percentage = calculateEditPercentage('abc', 'abcd');
      expect(percentage).toBe(Math.round(percentage * 100) / 100);
    });

    it('should never exceed 100%', () => {
      const percentage = calculateEditPercentage('short', 'much longer string with many changes');
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });
});
