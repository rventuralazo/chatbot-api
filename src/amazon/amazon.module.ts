import { Module } from '@nestjs/common';
import { AmazonService } from './amazon.service';
import { FirebaseService } from '../firebase/firebase.service';
import { DriverService } from '../driver/driver.service';
import { TripService } from '../trip/trip.service';

@Module({
  providers: [AmazonService, FirebaseService, DriverService, TripService],
})
export class AmazonModule {}
