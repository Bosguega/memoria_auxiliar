<script setup lang="ts">
import { ref, watch } from 'vue';
import { notesStore } from '../store/notesStore';

const emit = defineEmits<{
  save: [content: string];
}>();

const content = ref('');

watch(() => notesStore.editingNote, (note) => {
  if (note) {
    content.value = note.content;
  }
});

function submit() {
  const value = content.value.trim();
  if (!value) {
    return;
  }

  emit('save', value);
  content.value = '';
}

function cancel() {
  notesStore.editingNote = null;
  content.value = '';
}
</script>

<template>
  <section class="panel">
    <h2>{{ notesStore.editingNote ? 'Editar nota' : 'Nova nota' }}</h2>
    <form class="note-form" @submit.prevent="submit">
      <textarea
        v-model="content"
        rows="3"
        placeholder="Ex.: Levar documento ao medico na sexta"
      />
      <div class="form-actions">
        <button type="submit">{{ notesStore.editingNote ? 'Atualizar' : 'Salvar' }}</button>
        <button v-if="notesStore.editingNote" type="button" class="secondary" @click="cancel">Cancelar</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.form-actions {
  display: flex;
  gap: 10px;
}
</style>
