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
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AmazonModule } from './amazon/amazon.module';
import { TripModule } from './trip/trip.module';
import { DriverModule } from './driver/driver.module';
import { EbayModule } from './ebay/ebay.module';
import { SheinModule } from './shein/shein.module';
import { FirebaseModule } from './firebase/firebase.module';
@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'storage/media'),
      serveRoot: '/media',
    }),
    ChatbotModule,
    ChatModule,
    WebsocketModule,
    OpenaiModule,
    UsersModule,
    FilesModule,
    AmazonModule,
    TripModule,
    DriverModule,
    EbayModule,
    SheinModule,
    FirebaseModule,
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
