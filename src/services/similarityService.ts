import type { Note, SearchResult } from '../types';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function searchBySimilarity(notes: Note[], queryEmbedding: number[], limit = 5, threshold = 0.5): SearchResult[] {
  return notes
    .map((note) => ({
      note,
      score: cosineSimilarity(JSON.parse(note.embedding) as number[], queryEmbedding),
    }))
    .filter((result) => result.score >= threshold)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}
