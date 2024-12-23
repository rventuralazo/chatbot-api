import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { SupabaseService } from './supabase/supabase.service';
import { WebsocketModule } from './websocket/websocket.module';
import { OpenaiModule } from './openai/openai.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ChatbotModule,
    ChatModule,
    WebsocketModule,
    OpenaiModule,
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
