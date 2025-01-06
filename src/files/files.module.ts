import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { OpenAIService } from '../openai/openai.service';
import { SupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, OpenAIService, SupabaseService],
})
export class FilesModule {}
