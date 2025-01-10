import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ChatEventLogService {
  constructor(private readonly supabase: SupabaseService) {}

  async registerChatStart(chatId: number) {
    return await this.supabase.client
      .from('chat_event_log')
      .insert({ chat: chatId, action: 'conversation_started' });
  }
  async registerPausedChat(chatId: number, assignedTo?: string) {
    return await this.supabase.client
      .from('chat_event_log')
      .insert({ chat: chatId, action: 'chatbot_paused', user: assignedTo });
  }
  async registerResumedChat(chatId: number) {
    return await this.supabase.client
      .from('chat_event_log')
      .insert({ chat: chatId, action: 'chatbot_resumed' });
  }
  async registerPausedAnsweredChat(chatId: number, response_time: number) {
    return await this.supabase.client
      .from('chat_event_log')
      .insert({ chat: chatId, action: 'paused_answered', response_time });
  }
}
