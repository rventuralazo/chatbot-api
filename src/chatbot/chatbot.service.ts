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
const queueConfig: QueueConfig = { gapMilliseconds: 10000 };
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
    const adapterProvider = createProvider(Provider, {
      writeMyself: 'both',
    });
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
        const { number, message, media, quoted } = req.body;
        // const result = await bot.provider.vendor.sendMessage(number, {
        //   forward,
        //   text: message,
        //   image: media,
        // });
        const replyToMessage =
          quoted && (await this.chatService.getMessageByWhasappRef(quoted));
        const result = await bot.provider.vendor.sendMessage(
          `${number}@s.whatsapp.net`,
          {
            text: message,
            image: media,
          },
          {
            ...(replyToMessage && {
              quoted: replyToMessage.whatsapp_data as any,
            }),
          },
        );
        // const result = await bot.sendMessage(number, message, { media });
        console.log('Result', JSON.stringify(result));
        return res.end(JSON.stringify(result));
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
        if (ctx.key?.fromMe) {
          await this.chatService.saveChatMessage(savedChat.id, {
            message: ctx.body,
            isBot: true,
            messageId: ctx.key?.id,
            metadata: ctx,
            inReponseOf:
              ctx.message?.extendedTextMessage?.contextInfo?.stanzaId,
          });
          return;
        }
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
        console.log(
          'In response of',
          ctx.message?.extendedTextMessage?.contextInfo?.stanzaId,
        );
        await this.chatService.saveChatMessage(savedChat.id, {
          message: ctx.body,
          isBot: false,
          messageId: ctx.key?.id,
          metadata: ctx,
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
              const chunks = response?.split(/\n\s*\n/) ?? [];
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
                console.log(JSON.stringify(chunk));

                if (chunk.trim().endsWith('PAUSE_CHATBOT')) {
                  const message = chunk.replace('PAUSE_CHATBOT', '');
                  // await flowDynamic([{ body: message }]);
                  if (message.trim()) {
                    const result = await provider.sendText(
                      ctx.key.remoteJid,
                      message.trim(),
                    );
                    await this.chatService.saveChatMessage(savedChat.id, {
                      message: message,
                      isBot: true,
                      metadata: result,
                      messageId: result.key?.id,
                    });
                  }
                  await this.chatService.pauseChat(savedChat.id);
                } else {
                  console.log(chunk);
                  if (chunk.includes('[endImage]')) {
                    const messageWithImage = chunk.trim();
                    const imageUrl = messageWithImage
                      ?.match(/\[image\](.*?)\[endImage\]/s)
                      ?.at(1);
                    const updatedMessage = messageWithImage.replace(
                      /\[image\].*?\[endImage\]/s,
                      '',
                    );

                    // await flowDynamic([
                    //   {
                    //     media: imageUrl,
                    //     body: updatedMessage,
                    //   },
                    // ]);
                    const result = await provider.sendImage(
                      ctx.key.remoteJid,
                      imageUrl.trim(),
                      updatedMessage.trim(),
                    );
                    console.log('Image result', result);
                    await this.chatService.saveChatMessage(savedChat.id, {
                      message: updatedMessage,
                      isBot: true,
                      metadata: result,
                      messageId: result.key?.id,
                      mediaUrl: imageUrl,
                    });
                  } else {
                    if (chunk.trim()) {
                      // await flowDynamic([{ body: chunk.trim() }]);
                      const result = await provider.sendText(
                        ctx.key.remoteJid,
                        chunk.trim(),
                      );
                      await this.chatService.saveChatMessage(savedChat.id, {
                        message: chunk.trim(),
                        isBot: true,
                        metadata: result,
                        messageId: result.key?.id,
                      });
                    }
                  }
                }
              }
            } catch (error) {
              console.log(error);
            }
          }

          // else {
          //   const result = await provider.sendText(
          //     ctx.key.remoteJid,
          //     'Chatbot is paused',
          //   );
          //   console.log('Autoresult', result);
          // }
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
          isBot: !!ctx.key?.fromMe,
          mediaUrl: fullPath,
          metadata: ctx,
          messageId: (ctx as any).key?.id,
          inReponseOf: (ctx as any).message?.extendedTextMessage?.contextInfo
            ?.stanzaId,
          mediaType:
            (ctx as any).message?.imageMessage?.mimetype ??
            ctx.message?.documentWithCaptionMessage?.message?.documentMessage
              ?.mimetype,
        });
        if (!savedChat.paused && !ctx.key?.fromMe) {
          await new Promise((resolve) => setTimeout(resolve, 4000));
          const message = 'Espera un momento mientras revisamos la imagen';
          const result = await provider.sendText(
            ctx.key.remoteJid,
            message.trim(),
          );
          await this.chatService.saveChatMessage(savedChat.id, {
            message: message,
            isBot: true,
            metadata: result,
            messageId: result.key?.id,
          });
          await this.chatService.pauseChat(savedChat.id);
        }
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
