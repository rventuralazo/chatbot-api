import { Module } from '@nestjs/common';
import { EbayService } from './ebay.service';
import { TripService } from '../trip/trip.service';
import { DriverService } from '../driver/driver.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [EbayService, DriverService, TripService, FirebaseService],
})
export class EbayModule {}
