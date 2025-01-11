import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { OpenAIService } from '../openai/openai.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AssistantActionService } from '../openai/assistant-action.service';
import { AmazonService } from '../amazon/amazon.service';
import { EbayService } from '../ebay/ebay.service';
import { SheinService } from '../shein/shein.service';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    OpenAIService,
    SupabaseService,
    AssistantActionService,
    AmazonService,
    EbayService,
    SheinService,
    DriverService,
    TripService,
    FirebaseService,
  ],
})
export class FilesModule {}
