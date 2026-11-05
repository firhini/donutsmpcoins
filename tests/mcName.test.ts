import { describe, expect, it } from 'vitest';
import { MC_USERNAME_RE, isBedrockName, mcNameProblem, toBedrockName } from '../src/shared/mcName';
import { requireUsername } from '../netlify/lib/http';

describe('Minecraft names (Java + Bedrock)', () => {
  it('accepts Java names', () => {
    for (const n of ['Notch', 'chickenwing2385', 'a_b', 'ABCDEFGHIJKLMNOP']) expect(MC_USERNAME_RE.test(n)).toBe(true);
  });
  it('accepts Bedrock names with the DonutSMP dot prefix', () => {
    for (const n of ['.Steve_123', '.A', '.CoolGamer12345678'.slice(0, 17)]) expect(MC_USERNAME_RE.test(n)).toBe(true);
    expect(isBedrockName('.Steve')).toBe(true);
    expect(isBedrockName('Steve')).toBe(false);
  });
  it('rejects junk', () => {
    for (const n of ['ab', 'with space', 'a-b', '..x', '.', '.has space', 'x'.repeat(17)]) expect(MC_USERNAME_RE.test(n)).toBe(false);
  });
  it('turns a gamertag into the in-game Bedrock name', () => {
    expect(toBedrockName('Steve 123')).toBe('.Steve_123');
    expect(toBedrockName('.Steve 123')).toBe('.Steve_123');
    expect(toBedrockName('  Cool  Gamer! ')).toBe('.Cool_Gamer');
    expect(toBedrockName('')).toBe('');
  });
  it('explains problems', () => {
    expect(mcNameProblem('.Steve_123')).toBeNull();
    expect(mcNameProblem('Notch')).toBeNull();
    expect(mcNameProblem('No tch')).toMatch(/Bedrock/);
  });
  it('server accepts both', () => {
    expect(requireUsername('.Steve_123')).toBe('.Steve_123');
    expect(requireUsername('Notch')).toBe('Notch');
    expect(() => requireUsername('bad name')).toThrow();
  });
});
