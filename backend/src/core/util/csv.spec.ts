import { csvNumberCell, csvTextCell } from './csv';

describe('csv utils', () => {
  it('quotes fields containing commas, quotes or newlines', () => {
    expect(csvTextCell('a,b')).toBe('"a,b"');
    expect(csvTextCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvTextCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('prefixes text cells that start with a formula character', () => {
    expect(csvTextCell('=1+1')).toBe("'=1+1");
    expect(csvTextCell('+cmd')).toBe("'+cmd");
    expect(csvTextCell('-5')).toBe("'-5");
    expect(csvTextCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvTextCell('\tfoo')).toBe("'\tfoo");
  });

  it('formula-escaped fields are still quoted when needed', () => {
    expect(csvTextCell('=a,b')).toBe(`"'=a,b"`);
  });

  it('leaves plain text and numbers untouched', () => {
    expect(csvTextCell('comida')).toBe('comida');
    expect(csvTextCell(null)).toBe('');
    expect(csvNumberCell(-120.5)).toBe('-120.5');
    expect(csvNumberCell(undefined)).toBe('0');
  });
});
