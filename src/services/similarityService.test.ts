import { describe, expect, it } from 'vitest';
import type { Note } from '../types';
import { cosineSimilarity, searchBySimilarity } from './similarityService';

function note(id: number, embedding: string): Note {
  return {
    id,
    content: `nota ${id}`,
    embedding,
    created_at: '2026-05-05T00:00:00Z',
  };
}

describe('cosineSimilarity', () => {
  it('returns 0 for empty or incompatible vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 0], [1])).toBe(0);
  });

  it('scores equivalent vectors as 1', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
  });
});

describe('searchBySimilarity', () => {
  it('skips invalid embeddings without throwing', () => {
    const results = searchBySimilarity(
      [note(1, '[1,0]'), note(2, 'invalid-json'), note(3, '[0,1]')],
      [1, 0],
      5,
      0.1,
    );

    expect(results.map((result) => result.note.id)).toEqual([1]);
  });
});
