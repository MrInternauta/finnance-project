import { escapeLike } from './escape-like';

describe('escapeLike', () => {
  it('escapes %, _ and backslash', () => {
    expect(escapeLike('%')).toBe('\\%');
    expect(escapeLike('50% off_\\deal')).toBe('50\\% off\\_\\\\deal');
  });

  it('leaves plain text untouched', () => {
    expect(escapeLike('comida')).toBe('comida');
  });
});
