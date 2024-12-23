import {
  addKeyword,
  createBot,
  createFlow,
  createProvider,
  EVENTS,
} from '@builderbot/bot';
import { typing } from './utils/presence';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
// import { TelegramProvider } from '@builderbot-plugins/telegram';
import { MemoryDB as Database } from '@builderbot/bot';
// import welcomeFlow from './flows/welcome';
// import { MetaProvider } from '@builderbot/provider-meta';
import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { OpenAIService } from '../openai/openai.service';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly chatService: ChatService,
    private readonly openaiService: OpenAIService,
  ) {
    this.initialize();
  }
  async initialize() {
    console.log('Initializing chatbot');
    const adapterFlow = createFlow([this.getWelcomeFlow()]);
    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database();

    const { httpServer, handleCtx } = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
    httpServer(3001);
    adapterProvider.server.post(
      '/v1/messages',
      handleCtx(async (bot, req, res) => {
        const { number, message, media } = req.body;
        await bot.sendMessage(number, message, { media });
        return res.end('send');
      }),
    );
  }

  getWelcomeFlow() {
    return addKeyword<Provider, Database>(EVENTS.WELCOME).addAction(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async (ctx, { flowDynamic, state, provider }) => {
        let thread = state.get('thread') ?? null;
        //const assistants = await retrieveAssistants(assistantId);
        if (!thread) {
          const threadObject = await this.openaiService.createThread();
          thread = threadObject.id;
          await state.update({ thread });
        }
        console.dir(state);

        const savedChat = await this.chatService.getPhoneChat(
          ctx.from,
          ctx.name,
          thread,
        );
        await this.chatService.saveChatMessage(savedChat.id, {
          message: ctx.body,
          isBot: false,
        });
        await typing(ctx, provider);

        // const botResponse = 'Hello, I am a chatbot!';
        // flowDynamic([{ body: botResponse }]);
        // await this.chatService.saveChatMessage(savedChat.id, {
        //   message: botResponse,
        //   isBot: true,
        // });
        const response = await this.openaiService.toAsk(ctx.body, state);
        const chunks = response.split(/(?<!\d)\.\s+/g);
        for (const chunk of chunks) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await typing(ctx, provider);
          await flowDynamic([{ body: chunk.trim() }]);
          await this.chatService.saveChatMessage(savedChat.id, {
            message: chunk.trim(),
            isBot: true,
          });
        }
      },
    );
  }
}
