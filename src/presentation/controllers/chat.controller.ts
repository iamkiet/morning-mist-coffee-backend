import type { FastifyReply, FastifyRequest } from 'fastify';
import type { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatRequestSchema } from '../schemas/chat.schema.js';
import type { ProductUseCases } from './product.controller.js';

export class ChatController {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly productUc: ProductUseCases) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  handleChat = async (
    req: FastifyRequest<{ Body: z.infer<typeof ChatRequestSchema> }>,
    reply: FastifyReply,
  ) => {
    if (!process.env.GEMINI_API_KEY) {
      return reply.code(503).send({ error: 'AI_NOT_CONFIGURED', message: 'Gemini API is not configured' });
    }

    const messages = req.body.messages;
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build the system prompt
    const systemInstruction = `
      Bạn là nhân viên tư vấn ảo tại cửa hàng cà phê cao cấp "Morning Mist Coffee".
      Phong cách trò chuyện: Nhã nhặn, thanh lịch, ân cần và tối giản (Organic Minimalism).
      Không trả lời dài dòng quá. Tập trung tư vấn các món cà phê có sẵn.
      Nếu khách hỏi về menu, hãy gọi công cụ để xem danh sách.
    `;

    // Fetch products to give context to the AI (Basic RAG/Context Injection)
    // Instead of full function calling for simplicity, we inject the menu into the prompt
    // if the list of products is small enough.
    const productResult = await this.productUc.list.execute({ limit: 50, offset: 0, sortBy: 'createdAt', sortDir: 'desc' });
    const menuContext = productResult.items.map(p => 
      `- ${p.name}: ${(p.priceCents / 100).toFixed(2)}$ (${p.currency}) - ${p.description || 'Không có mô tả'}`
    ).join('\n');

    const fullSystemInstruction = systemInstruction + '\n\nMenu hiện tại của cửa hàng:\n' + menuContext;

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
    
    const lastMessage = messages[messages.length - 1]?.content || '';

    const chat = model.startChat({
      history,
      systemInstruction: fullSystemInstruction,
    });

    try {
      const result = await chat.sendMessage(lastMessage);
      const text = result.response.text();
      return reply.send({ message: text });
    } catch (error) {
      req.log.error({ err: error }, 'Chat AI error');
      return reply.code(500).send({ error: 'INTERNAL_ERROR', message: 'Lỗi khi gọi AI' });
    }
  };
}
