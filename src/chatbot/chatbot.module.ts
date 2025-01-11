import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SupabaseService } from '../supabase/supabase.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { ChatService } from '../chat/chat.service';
import { OpenAIService } from '../openai/openai.service';
import { ChatbotController } from './chatbot.controller';
import { FilesService } from '../files/files.service';
import { ChatEventLogService } from '../chat/chat-event-log.service';
import { AssistantActionService } from '../openai/assistant-action.service';
import { AmazonService } from '../amazon/amazon.service';
import { EbayService } from '../ebay/ebay.service';
import { SheinService } from '../shein/shein.service';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [
    ChatbotService,
    SupabaseService,
    WebsocketGateway,
    ChatService,
    OpenAIService,
    FilesService,
    ChatEventLogService,
    AssistantActionService,
    AmazonService,
    EbayService,
    SheinService,
    DriverService,
    TripService,
    FirebaseService,
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
