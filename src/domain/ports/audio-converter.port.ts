export interface ConvertedAudio {
  wavBytes: Buffer;
  durationSeconds: number;
}

export interface AudioConverterPort {
  convertToWav(
    input: Buffer,
    inputMimeType: string,
    maxDurationSeconds: number,
  ): Promise<ConvertedAudio>;
}
