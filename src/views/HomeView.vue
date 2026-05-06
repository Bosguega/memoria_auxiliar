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
  notesStore.activeView = 'add';
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
    const results = searchBySimilarity(notesStore.notes, embedding, 5, 0.5);
    
    // 3. Gera resposta baseada no contexto
    const answer = await generateAnswer(question, results);
    
    // 4. Adiciona resposta ao chat com as fontes
    notesStore.messages.push({ 
      role: 'assistant', 
      content: answer,
      sources: results
    });
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
      <div class="header-content">
        <p>Memoria Auxiliar</p>
        <h1>Sua segunda mente com IA</h1>
      </div>
      
      <nav class="main-nav">
        <button 
          :class="{ active: notesStore.activeView === 'search' }"
          @click="notesStore.activeView = 'search'"
        >
          Pesquisar
        </button>
        <button 
          :class="{ active: notesStore.activeView === 'add' }"
          @click="notesStore.activeView = 'add'"
        >
          {{ notesStore.editingNote ? 'Editar Dica' : 'Incluir Dicas' }}
        </button>
        <button 
          :class="{ active: notesStore.activeView === 'chat' }"
          @click="notesStore.activeView = 'chat'"
        >
          Conversar (RAG)
        </button>
      </nav>
    </header>

    <div v-if="notesStore.loading" class="status-overlay">
      <div class="spinner"></div>
      <span>Processando...</span>
    </div>
    
    <div v-if="notesStore.error" class="error-banner">{{ notesStore.error }}</div>

    <!-- TELA: PESQUISAR -->
    <div v-if="notesStore.activeView === 'search'" class="view-container">
      <SearchBox @search="searchNotes" />
      <ResultsList :results="notesStore.results" @delete="removeNote" @edit="startEdit" />
      
      <section v-if="notesStore.results.length" class="summary-section">
        <button type="button" class="secondary" @click="generateSummary">
          Gerar resumo com IA
        </button>
        <p v-if="notesStore.summary" class="summary-box">{{ notesStore.summary }}</p>
      </section>
    </div>

    <!-- TELA: INCLUIR DICAS -->
    <div v-if="notesStore.activeView === 'add'" class="view-container">
      <NoteForm @save="createNote" />
    </div>

    <!-- TELA: RAG CHAT -->
    <div v-if="notesStore.activeView === 'chat'" class="view-container chat-view">
      <ChatPanel @ask="askAI" @edit="startEdit" @delete="removeNote" />
    </div>
  </main>
</template>
