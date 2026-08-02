import type { ChatPort, ChatTurn } from '../../domain/ports/chat.port.ts';
import { ExternalServiceError } from '../../lib/errors.ts';
import { GEMINI_FLASH_MODEL, type GeminiClient } from './gemini.client.ts';

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
  constructor(private readonly gemini: GeminiClient) {}

  async reply(
    systemInstruction: string,
    history: ChatTurn[],
    message: string,
  ): Promise<string> {
    try {
      const chat = this.gemini.chats.create({
        model: GEMINI_FLASH_MODEL,
        config: { systemInstruction },
        history: toAlternatingHistory(history),
      });
      const response = await chat.sendMessage({ message });
      const text = response.text;
      if (text === undefined) {
        throw new ExternalServiceError('Gemini', 'Chat returned no text');
      }
      return text;
    } catch (error) {
      throw new ExternalServiceError('Gemini', 'Chat request failed', error);
    }
  }
}
