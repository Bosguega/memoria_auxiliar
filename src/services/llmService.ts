import type { SearchResult } from '../types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const llmModel = import.meta.env.VITE_GEMINI_LLM_MODEL || 'gemini-2.5-flash-lite';

interface GeminiGenerateResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export async function summarizeResults(results: SearchResult[]): Promise<string> {
  if (!results.length) {
    throw new Error('Nao ha resultados para resumir.');
  }

  if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
    throw new Error('Configure VITE_GEMINI_API_KEY no arquivo .env.');
  }

  const notes = results
    .map((result, index) => `${index + 1}. ${result.note.content}`)
    .join('\n');

  const prompt = `Resuma ou organize as informacoes abaixo de forma clara. Use apenas os dados fornecidos.\n\n${notes}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao gerar resumo: ${response.status} ${details}`);
  }

  const data = await response.json() as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  if (!text) {
    throw new Error('A API nao retornou resumo.');
  }

  return text;
}
export async function generateAnswer(question: string, results: SearchResult[]): Promise<string> {
  if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
    throw new Error('Configure VITE_GEMINI_API_KEY no arquivo .env.');
  }

  const context = results.length > 0 
    ? results.map((r, i) => `[Nota ${i+1}]: ${r.note.content}`).join('\n')
    : 'Nenhuma nota relevante encontrada.';

  const prompt = `Voce e um assistente de memoria pessoal. Responda a pergunta do usuario usando as notas fornecidas como contexto. 
Se a resposta nao estiver nas notas, avise que nao encontrou informacao sobre isso nas suas memorias.

CONTEXTO:
${context}

PERGUNTA:
${question}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${llmModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao gerar resposta: ${response.status} ${details}`);
  }

  const data = await response.json() as GeminiGenerateResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  
  if (!text) {
    throw new Error('A API nao retornou resposta.');
  }

  return text;
}
