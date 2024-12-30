import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OpenAIService } from '../openai/openai.service';
import { ChatbotService } from './chatbot.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('/api/chatbot')
@UseGuards(AuthGuard('jwt'))
export class ChatbotController {
  constructor(
    private readonly openaiService: OpenAIService,
    private readonly chatbotService: ChatbotService,
  ) {}

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
  @Get('/require-action')
  async requireAction() {
    return await this.chatbotService.getRequireAction();
  }
  @Get('/connection-status')
  async connectionStatus() {
    const status = await this.chatbotService.getConnectionStatus();
    return { status };
  }
}
