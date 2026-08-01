export interface MultimodalEmbeddingPort {
  embedText(text: string): Promise<number[]>;
  embedAudio(audioBytes: Buffer, mimeType: string): Promise<number[]>;
}
