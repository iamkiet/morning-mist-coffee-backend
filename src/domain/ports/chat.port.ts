export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatPort {
  reply(systemInstruction: string, history: ChatTurn[], message: string): Promise<string>;
}
