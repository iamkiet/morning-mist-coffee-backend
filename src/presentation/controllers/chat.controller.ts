import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatRequestSchema } from '../schemas/chat.schema.js';
import type { ProductUseCases } from './product.controller.js';
import { env } from '../../config/env.js';
import { ValidationError } from '../../lib/errors.js';

export class ChatController {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly productUc: ProductUseCases) {
    const apiKey = env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  handleChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof ChatRequestSchema> }>,
    reply: FastifyReply,
  ) => {
    if (!env.GEMINI_API_KEY) {
      return reply.code(503).send({ error: 'AI_NOT_CONFIGURED', message: 'Gemini API is not configured' });
    }

    const messages = req.body.messages;
    const lastMsg = messages.at(-1);
    if (!lastMsg || lastMsg.role !== 'user') {
      throw new ValidationError('Last message must be from user');
    }

    // Build the system prompt
    const systemInstruction = `
      You are a virtual assistant at the high-end coffee shop "Morning Mist Coffee".
      Converse in Vietnamese.
      Conversation style: Courteous, elegant, attentive, and organic minimalist.
      Do not make responses too long. Focus on recommending available coffee items.
      If the customer asks about the product list, call the tool to view the list.
    `;

    // Fetch products to give context to the AI (Basic RAG/Context Injection)
    // We optimize this by limiting to 30 products, truncating descriptions to 100 chars,
    // and using a compact format to reduce API token usage and improve response latency.
    const productResult = await this.productUc.list.execute({ limit: 30, offset: 0, sortBy: 'createdAt', sortDir: 'desc' });
    const productListContext = productResult.items.map(p => {
      const desc = p.description 
        ? (p.description.length > 100 ? p.description.slice(0, 100) + '...' : p.description) 
        : 'No description';
      return `- ${p.name}: ${(p.priceCents / 100).toFixed(2)}$ (${p.currency}) | ${desc}`;
    }).join('\n');

    const fullSystemInstruction = systemInstruction + '\n\nCurrent product list of the shop:\n' + productListContext;

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: fullSystemInstruction,
    });

    // Convert messages to Gemini format
    let history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // 1. Ensure history starts with 'user'
    const firstUserIndex = history.findIndex(h => h.role === 'user');
    if (firstUserIndex > 0) {
      history = history.slice(firstUserIndex);
    } else if (firstUserIndex === -1 && history.length > 0) {
      history = [];
    }

    // 2. Merge consecutive messages from the same role to ensure alternation
    const alternatingHistory: typeof history = [];
    for (const msg of history) {
      if (alternatingHistory.length > 0 && alternatingHistory.at(-1)!.role === msg.role) {
        alternatingHistory.at(-1)!.parts[0]!.text += '\n' + msg.parts[0]!.text;
      } else {
        alternatingHistory.push(msg);
      }
    }
    history = alternatingHistory;
    
    const lastMessage = messages.at(-1)?.content || '';

    const chat = model.startChat({
      history,
    });

    try {
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      return reply.send({ message: text });
    } catch (error) {
      req.log.error({ err: error }, 'Chat AI error');
      return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Error calling AI' });
    }
  };
}
