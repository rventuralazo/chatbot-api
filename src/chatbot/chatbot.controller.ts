import { Body, Controller, Get, Post } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';

@Controller('/api/chatbot')
export class ChatbotController {
  constructor(private readonly openaiService: OpenAIService) {}

  @Get('/instructions')
  async getInstructions() {
    const data = await this.openaiService.getActualInstructions();
    return { data };
  }
  @Post('/improve')
  async improve(@Body() data: { message: string }) {
    return await this.openaiService.improveInstructions(data.message);
  }
  @Post('/update-instructions')
  async updateInstructions(@Body() data: { message: string }) {
    return await this.openaiService.updateInstructions(data.message);
  }
}
