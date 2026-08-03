import { describe, it, expect } from 'vitest';
import { decodeEntities } from './text';

describe('decodeEntities', () => {
  it('returns the input unchanged when there are no entities', () => {
    expect(decodeEntities('The Matrix')).toBe('The Matrix');
  });

  it('decodes named HTML entities', () => {
    expect(decodeEntities('D&apos;Arcy')).toBe("D'Arcy");
  });

  it('decodes numeric HTML entities', () => {
    expect(decodeEntities('Caf&#233;')).toBe('Café');
  });

  it('does not re-parse decoded text as markup', () => {
    expect(decodeEntities('&lt;script&gt;')).toBe('<script>');
  });
});
