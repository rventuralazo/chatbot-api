import { Module } from '@nestjs/common';
import { TripService } from './trip.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [TripService, FirebaseService],
})
export class TripModule {}
