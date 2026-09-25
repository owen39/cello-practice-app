import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './id';

afterEach(() => vi.unstubAllGlobals());

describe('ID generation', () => {
  it('creates a UUID v4 when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues(bytes: Uint8Array) {
        bytes.set(Array.from({ length: 16 }, (_, index) => index));
        return bytes;
      }
    });

    expect(createId()).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f');
  });
});
