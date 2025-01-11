import { Module } from '@nestjs/common';
import { SheinService } from './shein.service';

@Module({
  providers: [SheinService],
})
export class SheinModule {}
