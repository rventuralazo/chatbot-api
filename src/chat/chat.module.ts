import { Module } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { ChatEventLogService } from './chat-event-log.service';

@Module({
  providers: [
    SupabaseService,
    ChatService,
    WebsocketGateway,
    ChatEventLogService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}
