<script setup lang="ts">
import { ref } from 'vue';
import { notesStore } from '../store/notesStore';

const emit = defineEmits<{
  ask: [question: string];
}>();

const question = ref('');

function submit() {
  const value = question.value.trim();
  if (!value) return;
  
  emit('ask', value);
  question.value = '';
}
</script>

<template>
  <section class="panel chat-panel">
    <h2>Perguntar as memorias (RAG)</h2>
    
    <div v-if="notesStore.messages.length" class="chat-history">
      <div 
        v-for="(msg, index) in notesStore.messages" 
        :key="index" 
        :class="['message', msg.role]"
      >
        <span class="role">{{ msg.role === 'user' ? 'Voce' : 'IA' }}</span>
        <p>{{ msg.content }}</p>
      </div>
    </div>
    
    <form class="chat-form" @submit.prevent="submit">
      <input 
        v-model="question" 
        type="text" 
        placeholder="Ex.: Qual o nome do meu medico?"
      />
      <button type="submit" :disabled="notesStore.loading">Enviar</button>
    </form>
  </section>
</template>

<style scoped>
.chat-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 10px;
}

.message {
  padding: 12px;
  border-radius: 12px;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  background: rgba(56, 189, 248, 0.1);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.message.assistant {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.role {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 4px;
  display: block;
  opacity: 0.6;
}

.chat-form {
  display: flex;
  gap: 10px;
}

.chat-form input {
  flex: 1;
}

p {
  margin: 0;
  line-height: 1.5;
  font-size: 0.95rem;
}
</style>
