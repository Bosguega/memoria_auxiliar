<script setup lang="ts">
import { onMounted } from 'vue';
import ChatPanel from '../components/ChatPanel.vue';
import NoteForm from '../components/NoteForm.vue';
import ResultsList from '../components/ResultsList.vue';
import SearchBox from '../components/SearchBox.vue';
import { deleteNote, listNotes, saveNote, updateNote } from '../services/databaseService';
import { getEmbedding } from '../services/embeddingService';
import { generateAnswer, summarizeResults } from '../services/llmService';
import { searchBySimilarity } from '../services/similarityService';
import { notesStore } from '../store/notesStore';
import type { Note } from '../types';

async function loadNotes() {
  notesStore.notes = await listNotes();
}

async function createNote(content: string) {
  await runAction(async () => {
    const embedding = await getEmbedding(content);
    if (notesStore.editingNote) {
      await updateNote(notesStore.editingNote.id, content, embedding);
      const updatedNote = { ...notesStore.editingNote, content, embedding: JSON.stringify(embedding) };
      notesStore.notes = notesStore.notes.map(n => n.id === updatedNote.id ? updatedNote : n);
      notesStore.results = notesStore.results.map(r => r.note.id === updatedNote.id ? { ...r, note: updatedNote } : r);
      notesStore.editingNote = null;
    } else {
      const note = await saveNote(content, embedding);
      notesStore.notes = [note, ...notesStore.notes];
    }
  });
}

function startEdit(note: Note) {
  notesStore.editingNote = note;
}

async function searchNotes(query: string) {
  if (!query.trim()) {
    notesStore.results = [];
    return;
  }
  await runAction(async () => {
    const embedding = await getEmbedding(query);
    notesStore.results = searchBySimilarity(notesStore.notes, embedding);
    notesStore.summary = '';
  });
}

async function removeNote(id: number) {
  if (!confirm('Tem certeza que deseja excluir esta nota?')) return;
  
  await runAction(async () => {
    await deleteNote(id);
    notesStore.notes = notesStore.notes.filter(n => n.id !== id);
    notesStore.results = notesStore.results.filter(r => r.note.id !== id);
  });
}

async function generateSummary() {
  await runAction(async () => {
    notesStore.summary = await summarizeResults(notesStore.results);
  });
}

async function askAI(question: string) {
  await runAction(async () => {
    // 1. Adiciona pergunta ao chat
    notesStore.messages.push({ role: 'user', content: question });
    
    // 2. Busca contexto relevante
    const embedding = await getEmbedding(question);
    const results = searchBySimilarity(notesStore.notes, embedding, 5, 0.4);
    
    // 3. Gera resposta baseada no contexto
    const answer = await generateAnswer(question, results);
    
    // 4. Adiciona resposta ao chat
    notesStore.messages.push({ role: 'assistant', content: answer });
  });
}

async function runAction(action: () => Promise<void>) {
  notesStore.loading = true;
  notesStore.error = '';

  try {
    await action();
  } catch (error) {
    notesStore.error = error instanceof Error ? error.message : 'Erro inesperado.';
  } finally {
    notesStore.loading = false;
  }
}

onMounted(() => {
  runAction(loadNotes);
});
</script>

<template>
  <main class="app-shell">
    <header>
      <p>Memoria Auxiliar</p>
      <h1>Notas curtas com armazenamento local e IA Gemini</h1>
    </header>

    <SearchBox @search="searchNotes" />
    <NoteForm @save="createNote" />
    <ChatPanel @ask="askAI" />

    <div v-if="notesStore.loading" class="status">Processando...</div>
    <div v-if="notesStore.error" class="error">{{ notesStore.error }}</div>

    <ResultsList :results="notesStore.results" @delete="removeNote" @edit="startEdit" />

    <section v-if="notesStore.results.length" class="panel">
      <button type="button" class="secondary" @click="generateSummary">
        Gerar resumo com IA
      </button>
      <p v-if="notesStore.summary" class="summary">{{ notesStore.summary }}</p>
    </section>
  </main>
</template>
