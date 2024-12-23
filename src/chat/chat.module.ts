import { Module } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Module({
  providers: [SupabaseService, ChatService, WebsocketGateway],
  controllers: [ChatController],
})
export class ChatModule {}
