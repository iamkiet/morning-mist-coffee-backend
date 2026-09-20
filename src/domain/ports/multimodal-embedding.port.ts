export interface MultimodalEmbeddingPort {
  embedDocument(text: string): Promise<number[]>;
  embedChatQuery(text: string): Promise<number[]>;
  embedAudioQuery(audioBytes: Buffer, mimeType: string): Promise<number[]>;
}
