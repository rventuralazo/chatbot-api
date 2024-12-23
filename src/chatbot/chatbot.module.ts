import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SupabaseService } from '../supabase/supabase.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { ChatService } from '../chat/chat.service';
import { OpenAIService } from '../openai/openai.service';

@Module({
  providers: [
    ChatbotService,
    SupabaseService,
    WebsocketGateway,
    ChatService,
    OpenAIService,
  ],
})
export class ChatbotModule {}
