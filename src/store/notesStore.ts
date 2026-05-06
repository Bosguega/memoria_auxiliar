import { reactive } from 'vue';
import type { ChatMessage, Note, SearchResult } from '../types';

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function loadStats() {
  const stored = localStorage.getItem('memoria_auxiliar_stats');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { streak: 0, lastUse: null };
    }
  }
  return { streak: 0, lastUse: null };
}

function saveStats(stats: any) {
  localStorage.setItem('memoria_auxiliar_stats', JSON.stringify(stats));
}

export function updateStreak() {
  const today = getTodayString();
  if (notesStore.stats.lastUse !== today) {
    if (notesStore.stats.lastUse === getYesterdayString()) {
      notesStore.stats.streak += 1;
    } else {
      notesStore.stats.streak = 1;
    }
    notesStore.stats.lastUse = today;
    saveStats(notesStore.stats);
  }
}

function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

const stats = loadStats();

export const notesStore = reactive({
  notes: [] as Note[],
  results: [] as SearchResult[],
  editingNote: null as Note | null,
  messages: [] as ChatMessage[],
  summary: '',
  loading: false,
  loadingMessage: '',
  error: '',
  activeView: 'search' as 'search' | 'add' | 'chat' | 'insights',
  confirmModal: {
    show: false,
    message: '',
    onConfirm: (() => {}) as () => void,
  },
  stats: reactive(stats),
});
