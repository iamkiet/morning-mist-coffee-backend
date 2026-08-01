export interface TranscriptionPort {
  transcribe(audioBytes: Buffer, mimeType: string): Promise<string>;
}
