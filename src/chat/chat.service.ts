import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { SupabaseService } from '../supabase/supabase.service';
import { Database } from '../supabase/database.types';
import { PageOptionsDto } from '../common/dtos/page-options.dto';
import { PageDto, PageMetaDto } from '../common/dtos/page-meta.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly websocket: WebsocketGateway,
  ) {}
  async getChatList(pageOptions: PageOptionsDto) {
    const query = this.supabase.getSupabase().from('chat');
    await query.select('*', { count: 'exact', head: true });

    const chats = await query
      .select()
      .order('lastMessageDate', { ascending: false })
      .range(+pageOptions.skip, +(pageOptions.skip + (pageOptions.take - 1)));
    const itemCount = chats.count;
    const data = chats.data;
    const chatList = [];
    for (const chat of data) {
      const messages = await this.supabase
        .getSupabase()
        .from('chat_message')
        .select()
        .order('created_at', { ascending: false })
        .limit(1)
        .eq('chat', chat.id);
      chatList.push({
        ...chat,
        lastMessage: messages.data[0],
      });
    }

    const meta = new PageMetaDto({ itemCount, pageOptionsDto: pageOptions });

    return new PageDto(chatList, meta);
  }

  async getPhoneChat(phone: string, name: string) {
    const records = await this.supabase
      .getSupabase()
      .from('chat')
      .select()
      .eq('phone', phone);
    let savedChat;
    if (records.data.length === 0) {
      const savedChatQuery = await this.supabase
        .getSupabase()
        .from('chat')
        .insert({ phone, paused: false, name: name })
        .select();
      savedChat = savedChatQuery.data[0];
      savedChat.isNew = true;
    } else {
      savedChat = records.data[0];
    }
    return savedChat as Database['public']['Tables']['chat']['Row'] & {
      isNew?: boolean;
    };
  }
  async updateChatTheadId(chatId: number, threadId: string) {
    await this.supabase
      .getSupabase()
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
    await this.supabase
      .getSupabase()
      .from('chat_message')
      .insert({
        chat: chatId,
        message: message,
        isBot,
        media_url: mediaUrl,
        media_type: mediaType,
        isRead: isBot ? true : false,
      });
    await this.supabase
      .getSupabase()
      .from('chat')
      .update({ lastMessageDate: new Date().toISOString() })
      .eq('id', chatId);
    this.websocket.server.emit('message', {
      chat: chatId,
      message: message,
      isBot,
    });
  }
  async pauseChat(id: number) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ paused: true })
      .eq('id', id);
  }
  async resumeChat(id: number) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ paused: false })
      .eq('id', id);
  }
  async updateUrlPicture(chatId: number, url: string) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ urlPicture: url })
      .eq('id', chatId);
  }
}
