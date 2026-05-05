import { getCachedEmbedding, saveCachedEmbedding } from './databaseService';
import { sha256 } from './hashService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const embeddingModel = import.meta.env.VITE_GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
  embeddings?: Array<{
    values?: number[];
  }>;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const normalized = text.trim();
  if (!normalized) {
    throw new Error('Texto vazio nao pode gerar embedding.');
  }

  const hash = await sha256(normalized);
  const cached = await getCachedEmbedding(hash);
  if (cached) {
    return cached;
  }

  if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
    throw new Error('Configure VITE_GEMINI_API_KEY no arquivo .env.');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${embeddingModel}:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${embeddingModel}`,
        content: {
          parts: [{ text: normalized }],
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao gerar embedding: ${response.status} ${details}`);
  }

  const data = await response.json() as GeminiEmbeddingResponse;
  const embedding = data.embedding?.values ?? data.embeddings?.[0]?.values;
  if (!embedding?.length) {
    throw new Error('A API nao retornou um embedding valido.');
  }

  await saveCachedEmbedding(hash, embedding);
  return embedding;
}
