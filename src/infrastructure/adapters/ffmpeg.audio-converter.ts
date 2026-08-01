import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import type { AudioConverterPort, ConvertedAudio } from '../../domain/ports/audio-converter.port.js';
import { ValidationError } from '../../lib/errors.js';

const EXT_BY_MIME: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
};

function probeDurationSeconds(path: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    ffmpeg.ffprobe(path, (err: Error | null, data) => {
      if (err) reject(err);
      else resolve(data.format.duration ?? 0);
    });
  });
}

export class FfmpegAudioConverterAdapter implements AudioConverterPort {
  async convertToWav(
    input: Buffer,
    inputMimeType: string,
    maxDurationSeconds: number,
  ): Promise<ConvertedAudio> {
    const ext = EXT_BY_MIME[inputMimeType];
    if (!ext) {
      throw new ValidationError(`Unsupported audio format: ${inputMimeType}`);
    }

    const dir = await mkdtemp(join(tmpdir(), `voice-search-${randomUUID()}-`));
    const inputPath = join(dir, `input.${ext}`);
    const outputPath = join(dir, 'output.wav');

    try {
      await writeFile(inputPath, input);

      const durationSeconds = await probeDurationSeconds(inputPath);
      if (durationSeconds > maxDurationSeconds) {
        throw new ValidationError(
          `Audio too long: ${durationSeconds.toFixed(1)}s (max ${maxDurationSeconds}s)`,
        );
      }

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat('wav')
          .audioChannels(1)
          .audioFrequency(16000)
          .on('error', (err: Error) => reject(err))
          .on('end', () => resolve())
          .save(outputPath);
      });

      const wavBytes = await readFile(outputPath);
      return { wavBytes, durationSeconds };
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
