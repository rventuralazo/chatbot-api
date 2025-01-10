import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { SupabaseService } from '../supabase/supabase.service';
import { Database } from '../supabase/database.types';
import { PageOptionsDto } from '../common/dtos/page-options.dto';
import { PageDto, PageMetaDto } from '../common/dtos/page-meta.dto';
import { ChatEventLogService } from './chat-event-log.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly websocket: WebsocketGateway,
    private readonly chatEventLogService: ChatEventLogService,
  ) {}
  async getChatList(pageOptions: PageOptionsDto) {
    const query = this.supabase.client.from('chat');
    await query.select('*', { count: 'exact', head: true });

    const chats = await query
      .select()
      .order('paused', { ascending: false })
      .order('lastMessageDate', { ascending: false })
      .range(+pageOptions.skip, +(pageOptions.skip + (pageOptions.take - 1)));
    const itemCount = chats.count;
    const data = chats.data;
    const chatList = [];
    for (const chat of data) {
      const lastMessage = await this.getLastMessage(chat.id);
      chatList.push({
        ...chat,
        lastMessage: lastMessage,
      });
    }

    const meta = new PageMetaDto({ itemCount, pageOptionsDto: pageOptions });

    return new PageDto(chatList, meta);
  }

  async getPhoneChat(phone: string, name: string) {
    const records = await this.supabase.client
      .from('chat')
      .select()
      .eq('phone', phone);
    let savedChat;
    if (records.data.length === 0) {
      const savedChatQuery = await this.supabase.client
        .from('chat')
        .insert({ phone, paused: false, name: name })
        .select();
      savedChat = savedChatQuery.data[0];
      savedChat.isNew = true;
      await this.chatEventLogService.registerChatStart(savedChat.id);
    } else {
      savedChat = records.data[0];
    }
    return savedChat as Database['public']['Tables']['chat']['Row'] & {
      isNew?: boolean;
    };
  }
  async updateChatTheadId(chatId: number, threadId: string) {
    await this.supabase.client
      .from('chat')
      .update({ theadId: threadId })
      .eq('id', chatId);
  }

  async saveChatMessage(
    chatId: number,
    {
      message,
      isBot,
      mediaUrl,
      mediaType,
    }: {
      message: string;
      isBot: boolean;
      mediaUrl?: string;
      mediaType?: string;
    },
  ) {
    const currentChatInfos = await this.supabase.client
      .from('chat')
      .select()
      .eq('id', chatId);
    const currentChatInfo = currentChatInfos.data[0];
    await this.supabase.client.from('chat_message').insert({
      chat: chatId,
      message: message,
      isBot,
      media_url: mediaUrl,
      media_type: mediaType,
      isRead: isBot ? true : false,
    });
    let responseTime;
    if (currentChatInfo.paused && !currentChatInfo.pausedAnswered) {
      responseTime =
        new Date().getTime() - new Date(currentChatInfo.pausedTime).getTime();
      await this.chatEventLogService.registerPausedAnsweredChat(
        chatId,
        responseTime,
      );
    }
    if (isBot) {
      await this.supabase.client
        .from('chat')
        .update({
          lastMessageDate: new Date().toISOString(),
          pausedAnswered: !!responseTime,
          pausedTime: null,
        })
        .eq('id', chatId);
    } else {
      await this.supabase.client
        .from('chat')
        .update({
          lastMessageDate: new Date().toISOString(),
        })
        .eq('id', chatId);
    }
    this.websocket.server.emit('message', {
      chat: chatId,
      message: message,
      isBot,
    });
  }
  async getLastMessage(chatId: number) {
    const messages = await this.supabase.client
      .from('chat_message')
      .select()
      .order('created_at', { ascending: false })
      .limit(1)
      .eq('chat', chatId);
    return messages.data.at(0);
  }
  async getNextAvailableUser() {
    const availableUsers = this.websocket.usersOnline ?? [];
    const userChats: { id: string; chatCount: number }[] = [];
    for (const user of availableUsers) {
      const chatAssigned = await this.supabase.client
        .from('chat')
        .select()
        .eq('assignedTo', user.id);
      userChats.push({
        id: user.id,
        chatCount: chatAssigned.count,
      });
    }

    userChats.sort((a, b) => a.chatCount - b.chatCount);
    return userChats.at(0);
  }
  async pauseChat(id: number, autoAssign: boolean = true) {
    const availableUser = await this.getNextAvailableUser();
    console.log('Available User', availableUser);
    const result = await this.supabase.client
      .from('chat')
      .update({
        paused: true,
        pausedTime: new Date().toISOString(),
        ...(autoAssign && { assignedTo: availableUser?.id }),
      })
      .eq('id', id)
      .select();
    console.log('Pause Result', result.error);
    await this.chatEventLogService.registerPausedChat(
      id,
      autoAssign ? availableUser?.id : null,
    );
    this.websocket.server.emit('paused_chatbot', {
      savedChat: result.data.at(0),
    });
    return result;
  }
  async resumeChat(id: number) {
    const result = await this.supabase.client
      .from('chat')
      .update({
        paused: false,
        assignedTo: null,
        pausedTime: null,
        pausedAnswered: null,
      })
      .eq('id', id);
    await this.chatEventLogService.registerResumedChat(id);
    this.websocket.server.emit('resume_chatbot', {
      savedChat: {
        id,
      },
    });
    return result;
  }
  async markMessageAsRead(id: number) {
    this.supabase.client
      .from('chat_message')
      .update({ isRead: true })
      .eq('id', id);
  }
  async updateUrlPicture(chatId: number, url: string) {
    return await this.supabase.client
      .from('chat')
      .update({ urlPicture: url })
      .eq('id', chatId);
  }
  async updateChatNote(chatId: number, note: string) {
    return await this.supabase.client
      .from('chat')
      .update({ notes: note })
      .eq('id', chatId);
  }
}
