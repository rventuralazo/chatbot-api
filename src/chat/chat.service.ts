import { Injectable } from '@nestjs/common';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { SupabaseService } from '../supabase/supabase.service';
import { Database } from '../supabase/database.types';

@Injectable()
export class ChatService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly websocket: WebsocketGateway,
  ) {}

  async getPhoneChat(phone: string, name: string, threadId: string) {
    const records = await this.supabase
      .getSupabase()
      .from('chat')
      .select()
      .eq('phone', phone);
    console.log('Records', phone);
    let savedChat;
    if (records.data.length === 0) {
      const savedChatQuery = await this.supabase
        .getSupabase()
        .from('chat')
        .insert({ phone, paused: false, name: name, threadId })
        .select();
      savedChat = savedChatQuery.data[0];
    } else {
      savedChat = records.data[0];
    }
    return savedChat as Database['public']['Tables']['chat']['Row'];
  }

  async saveChatMessage(
    chatId: number,
    { message, isBot }: { message: string; isBot: boolean },
  ) {
    await this.supabase.getSupabase().from('chat_message').insert({
      chat: chatId,
      message: message,
      isBot,
    });
    this.websocket.server.emit('message', {
      chat: chatId,
      message: message,
      isBot,
    });
  }
}
