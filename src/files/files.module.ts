import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { OpenAIService } from '../openai/openai.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, OpenAIService],
})
export class FilesModule {}
