import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatPort, ChatTurn } from '../../domain/ports/chat.port.js';
import { ExternalServiceError } from '../../lib/errors.js';

const MODEL_NAME = 'gemini-2.5-flash';

interface GeminiTurn {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

function toAlternatingHistory(history: ChatTurn[]): GeminiTurn[] {
  const turns: GeminiTurn[] = history.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const firstUser = turns.findIndex((t) => t.role === 'user');
  const trimmed = firstUser === -1 ? [] : turns.slice(firstUser);

  const merged: GeminiTurn[] = [];
  for (const turn of trimmed) {
    const previous = merged.at(-1);
    if (previous && previous.role === turn.role) {
      previous.parts[0].text += `\n${turn.parts[0].text}`;
    } else {
      merged.push(turn);
    }
  }
  return merged;
}

export class GeminiChatAdapter implements ChatPort {
  private readonly genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async reply(
    systemInstruction: string,
    history: ChatTurn[],
    message: string,
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction,
      });
      const chat = model.startChat({ history: toAlternatingHistory(history) });
      const result = await chat.sendMessage(message);
      return result.response.text();
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Chat request failed', error);
    }
  }
}
