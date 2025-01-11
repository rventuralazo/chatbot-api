import { Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseModule as NestFirebase } from 'nestjs-firebase';
@Module({
  imports: [
    NestFirebase.forRoot({
      googleApplicationCredential:
        process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    }),
  ],
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
