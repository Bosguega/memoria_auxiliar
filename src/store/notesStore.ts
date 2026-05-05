import { reactive } from 'vue';
import type { ChatMessage, Note, SearchResult } from '../types';

export const notesStore = reactive({
  notes: [] as Note[],
  results: [] as SearchResult[],
  editingNote: null as Note | null,
  messages: [] as ChatMessage[],
  summary: '',
  loading: false,
  error: '',
});
