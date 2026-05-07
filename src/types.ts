export interface Note {
  id: number;
  content: string;
  embedding: string;
  created_at: string;
}

export interface SearchResult {
  note: Note;
  score: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResult[];
}

export interface Stats {
  streak: number;
  lastUse: string | null;
}
