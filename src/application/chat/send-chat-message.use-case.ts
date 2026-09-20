import { ValidationError } from '../../lib/errors.ts';
import type { AppLogger } from '../../domain/ports/logger.port.ts';
import type { AudioConverterPort } from '../../domain/ports/audio-converter.port.ts';
import type { ChatTurn } from '../../domain/ports/chat.port.ts';
import type { MultimodalEmbeddingPort } from '../../domain/ports/multimodal-embedding.port.ts';
import type { TranscriptionPort } from '../../domain/ports/transcription.port.ts';
import type { AnswerQueryResult, AnswerQueryService } from './answer-query.service.ts';
import { wrapUserMessage } from './build-chat-prompt.ts';

export interface ChatAudioInput {
  bytes: Buffer;
  mimeType: string;
}

export interface SendChatMessageResult extends AnswerQueryResult {
  transcript?: string;
}

export class SendChatMessageUseCase {
  constructor(
    private readonly embedding: MultimodalEmbeddingPort,
    private readonly transcription: TranscriptionPort,
    private readonly audioConverter: AudioConverterPort,
    private readonly answerQuery: AnswerQueryService,
    private readonly logger: AppLogger,
    private readonly maxAudioDurationSeconds: number,
  ) {}

  async execute(messages: ChatTurn[], audio?: ChatAudioInput): Promise<SendChatMessageResult> {
    return audio ? this.executeAudio(messages, audio) : this.executeText(messages);
  }

  private async executeText(messages: ChatTurn[]): Promise<SendChatMessageResult> {
    const last = messages.at(-1);
    if (!last || last.role !== 'user') {
      throw new ValidationError('Last message must be from user');
    }

    const vectorPromise = this.embedding.embedChatQuery(last.content).catch((err: unknown) => {
      this.logger.warn({ err }, 'Chat semantic retrieval failed, using keyword fallback');
      return null;
    });

    return this.answerQuery.answer(vectorPromise, last.content, wrapHistory(messages.slice(0, -1)));
  }

  private async executeAudio(
    messages: ChatTurn[],
    audio: ChatAudioInput,
  ): Promise<SendChatMessageResult> {
    const { wavBytes } = await this.audioConverter.convertToWav(
      audio.bytes,
      audio.mimeType,
      this.maxAudioDurationSeconds,
    );

    const transcript = await this.transcription.transcribe(wavBytes, 'audio/wav');
    if (!transcript) {
      throw new ValidationError('Could not understand the audio');
    }

    const vectorPromise = this.embedding.embedAudioQuery(wavBytes, 'audio/wav');
    const result = await this.answerQuery.answer(vectorPromise, transcript, wrapHistory(messages));
    return { ...result, transcript };
  }
}

function wrapHistory(messages: ChatTurn[]): ChatTurn[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.role === 'user' ? wrapUserMessage(m.content) : m.content,
  }));
}
