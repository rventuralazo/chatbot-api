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
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { createMessageQueue, QueueConfig } from './utils/fast-entires';
const queueConfig: QueueConfig = { gapMilliseconds: 5000 };
const enqueueMessage = createMessageQueue(queueConfig);
@Injectable()
export class ChatbotService {
  private connectionStatus: any = null;
  private requireAction: any = null;
  constructor(
    private readonly chatService: ChatService,
    private readonly openaiService: OpenAIService,
    private readonly websocket: WebsocketGateway,
  ) {
    this.initialize();
  }
  async initialize() {
    console.log('Initializing chatbot');
    const adapterFlow = createFlow([
      this.getWelcomeFlow(),
      this.getMediaFlow(),
    ]);
    const adapterProvider = createProvider(Provider);
    const adapterDB = new Database();

    const { httpServer, handleCtx, provider } = await createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });
    provider.on('host', async (data) => {
      this.connectionStatus = data;
      this.websocket.server.emit('connection_status', data);
      console.log(data);
    });
    provider.on('require_action', (data) => {
      this.websocket.server.emit('action_required', data);
      this.connectionStatus = null;
      this.requireAction = data;
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
        enqueueMessage(ctx, async (body) => {
          const savedChat = await this.chatService.getPhoneChat(
            ctx.from,
            ctx.name,
          );
          if (!savedChat.theadId) {
            const threadObject = await this.openaiService.createThread();
            const thread = threadObject.id;
            await this.chatService.updateChatTheadId(savedChat.id, thread);
            await state.update({ thread });
          } else {
            const thread = savedChat.theadId;
            await this.openaiService.clearAllRuns(thread);
            await state.update({ thread });
          }
          await this.chatService.saveChatMessage(savedChat.id, {
            message: ctx.body,
            isBot: false,
          });
          if (!savedChat.paused) {
            // await typing(ctx, provider);
            // const botResponse = 'Hello, I am a chatbot!';
            // flowDynamic([{ body: botResponse }]);
            // await this.chatService.saveChatMessage(savedChat.id, {
            //   message: botResponse,
            //   isBot: true,
            // });
            try {
              const response = await this.openaiService.toAsk(
                body,
                state,
                ctx.from,
              );
              const chunks = response.split(/(?<!\d)\.\s+/g);
              for (const chunk of chunks) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await typing(ctx, provider);
                if (chunk.trim() === 'PAUSE_CHATBOT') {
                  console.log('PAUSE_CHATBOT');
                  await this.chatService.pauseChat(savedChat.id);
                } else {
                  await flowDynamic([{ body: chunk.trim() }]);
                  await this.chatService.saveChatMessage(savedChat.id, {
                    message: chunk.trim(),
                    isBot: true,
                  });
                }
              }
            } catch (error) {
              console.log(error);
            }
          }
        });
      },
    );
  }
  getMediaFlow() {
    return addKeyword<Provider>([
      EVENTS.MEDIA,
      EVENTS.DOCUMENT,
      EVENTS.VOICE_NOTE,
    ]).addAction(async (ctx, { provider }) => {
      const savedChat = await this.chatService.getPhoneChat(ctx.from, ctx.name);
      const localPath = await provider.saveFile(ctx, {
        path: 'storage/media',
      });
      console.log(
        ctx.message?.documentWithCaptionMessage?.message?.documentMessage,
      );
      await this.chatService.saveChatMessage(savedChat.id, {
        message:
          (ctx as any).message?.imageMessage?.caption ??
          ctx.message?.documentWithCaptionMessage?.message?.documentMessage
            ?.caption,
        isBot: false,
        mediaUrl: 'media/' + localPath.split('/').pop(),
        mediaType:
          (ctx as any).message?.imageMessage?.mimetype ??
          ctx.message?.documentWithCaptionMessage?.message?.documentMessage
            ?.mimetype,
      });
      console.log(localPath);
    });
  }
  getConnectionStatus() {
    return this.connectionStatus;
  }
  getRequireAction() {
    return this.requireAction;
  }
}
