/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { OpenAIService } from '../openai/openai.service';
import { createReadStream } from 'fs';
import { createTempFileFromMulter } from '../common/utils/files';

@Injectable()
export class FilesService {
  constructor(private readonly openaiService: OpenAIService) {}
  async create(createFileDto: CreateFileDto, file: Express.Multer.File) {
    const { destroy, filepath } = createTempFileFromMulter(file);
    const vectorStore = (
      await this.openaiService.openai.beta.vectorStores.list()
    ).data.at(0).id;
    if (!vectorStore) throw new Error('No vector store found');
    const result =
      await this.openaiService.openai.beta.vectorStores.files.upload(
        vectorStore,
        createReadStream(filepath),
      );
    destroy();

    return result;
  }

  findAll() {
    return this.openaiService.getFilesIds();
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  async remove(id: string) {
    const vectorStore = (
      await this.openaiService.openai.beta.vectorStores.list()
    ).data.at(0).id;
    if (!vectorStore) throw new Error('No vector store found');
    await this.openaiService.openai.beta.vectorStores.files.del(
      vectorStore,
      id,
    );
    await this.openaiService.openai.files.del(id);
    return true;
  }
}
