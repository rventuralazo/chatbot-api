import { Module } from '@nestjs/common';
import { DriverService } from './driver.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [DriverService, FirebaseService],
})
export class DriverModule {}
