import { Module } from '@nestjs/common';
import { AmazonService } from '../amazon/amazon.service';
import { EbayService } from '../ebay/ebay.service';
import { SheinService } from '../shein/shein.service';
import { AssistantActionService } from './assistant-action.service';
import { OpenAIService } from './openai.service';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [
    OpenAIService,
    AssistantActionService,
    AmazonService,
    SheinService,
    EbayService,
    DriverService,
    TripService,
    FirebaseService,
  ],
})
export class OpenaiModule {}
