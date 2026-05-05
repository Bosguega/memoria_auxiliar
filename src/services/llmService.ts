import { invoke } from '@tauri-apps/api/core';
import type { SearchResult } from '../types';

export async function summarizeResults(results: SearchResult[]): Promise<string> {
  if (!results.length) {
    throw new Error('Nao ha resultados para resumir.');
  }

  return invoke<string>('summarize_notes', {
    notes: results.map((result) => result.note.content),
  });
}

export async function generateAnswer(question: string, results: SearchResult[]): Promise<string> {
  return invoke<string>('generate_answer', {
    question,
    contextNotes: results.map((result) => result.note.content),
  });
}
