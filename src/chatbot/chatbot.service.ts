import {
  addKeyword,
  createBot,
  createFlow,
  createProvider,
  EVENTS,
} from '@builderbot/bot';
import { typing } from './utils/presence';
import { BaileysProvider as Provider } from '@builderbot/provider-baileys';
import { MemoryDB as Database } from '@builderbot/bot';
import { Injectable } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
import { OpenAIService } from '../openai/openai.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { createMessageQueue, QueueConfig } from './utils/fast-entires';
import { FilesService } from '../files/files.service';
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
    private readonly filesService: FilesService,
  ) {
    this.initialize();
  }
  async initialize() {
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

      // console.log(myPicture);
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
        const savedChat = await this.chatService.getPhoneChat(
          ctx.from,
          ctx.name,
        );
        if (savedChat.isNew) {
          try {
            const pictureUrl = await provider.vendor.profilePictureUrl(
              ctx.key?.remoteJid,
              'image',
              10000,
            );
            await this.chatService.updateUrlPicture(savedChat.id, pictureUrl);
          } catch {}
        }
        await this.chatService.saveChatMessage(savedChat.id, {
          message: ctx.body,
          isBot: false,
          messageId: ctx.key?.id,
          inReponseOf: ctx.message?.extendedTextMessage?.contextInfo?.stanzaId,
        });
        enqueueMessage(ctx, async (body) => {
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
              const chunks = response.split(/\n\s*\n/);
              for (const chunk of chunks) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await typing(ctx, provider);

                // if (chunk.trim().endsWith('PAUSE_CHATBOT')) {
                //   const message = chunk.replace('PAUSE_CHATBOT', '');
                //   await flowDynamic([{ body: message }]);
                //   await this.chatService.saveChatMessage(savedChat.id, {
                //     message: message,
                //     isBot: true,
                //   });
                // }

                if (chunk.trim().endsWith('PAUSE_CHATBOT')) {
                  const message = chunk.replace('PAUSE_CHATBOT', '');
                  await flowDynamic([{ body: message }]);
                  await this.chatService.saveChatMessage(savedChat.id, {
                    message: message,
                    isBot: true,
                  });
                  await this.chatService.pauseChat(savedChat.id);
                } else {
                  console.log(chunk);
                  if (
                    chunk.endsWith('[endImage]') ||
                    chunk.endsWith('- [endImage]')
                  ) {
                    const imageUrl = chunk
                      ?.match(/\[image\](.*?)\[endImage\]/)
                      ?.at(1);
                    const updatedMessage = chunk.replace(
                      /\[image\].*?\[endImage\]/,
                      '',
                    );

                    await flowDynamic([
                      {
                        media: imageUrl,
                        body: updatedMessage,
                      },
                    ]);
                    await this.chatService.saveChatMessage(savedChat.id, {
                      message: updatedMessage,
                      isBot: true,
                    });
                  } else {
                    if (chunk.trim()) {
                      await flowDynamic([{ body: chunk.trim() }]);
                      await this.chatService.saveChatMessage(savedChat.id, {
                        message: chunk.trim(),
                        isBot: true,
                      });
                    }
                  }
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
      try {
        const savedChat = await this.chatService.getPhoneChat(
          ctx.from,
          ctx.name,
        );
        const localPath = await provider.saveFile(ctx, {
          path: 'storage/media',
        });
        // const savedPath = 'media/' + localPath.split('/').pop();
        const fullPath = await this.filesService.uploadWhatsappMedia(localPath);
        await this.chatService.saveChatMessage(savedChat.id, {
          message:
            (ctx as any).message?.imageMessage?.caption ??
            ctx.message?.documentWithCaptionMessage?.message?.documentMessage
              ?.caption,
          isBot: false,
          mediaUrl: fullPath,
          mediaType:
            (ctx as any).message?.imageMessage?.mimetype ??
            ctx.message?.documentWithCaptionMessage?.message?.documentMessage
              ?.mimetype,
        });
        console.log(fullPath);
      } catch (error) {
        console.log(error);
      }
    });
  }
  getConnectionStatus() {
    return this.connectionStatus;
  }
  getRequireAction() {
    return this.requireAction;
  }
}
