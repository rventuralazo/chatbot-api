import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ChatService } from './chat.service';
import axios from 'axios';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly chatService: ChatService,
  ) {}

  @Get('list')
  async getChatList() {
    const chats = await this.supabase.getSupabase().from('chat').select();
    return chats.data;
  }

  @Get(':id/messages')
  async getChatMessages(@Param('id') id: string) {
    const messages = await this.supabase
      .getSupabase()
      .from('chat_message')
      .select()
      .order('created_at', { ascending: false })
      .eq('chat', id);
    return messages.data;
  }
  @Post(':id/messages')
  async sendMessage(
    @Param('id') id: number,
    @Body() body: { number: string; message: string },
  ) {
    const response = await axios.post(
      `${process.env.BUILDERBOT_URL}/v1/messages`,
      {
        number: body.number,
        message: body.message,
      },
    );
    console.log(response);
    await this.chatService.saveChatMessage(id, {
      message: body.message,
      isBot: false,
    });
  }
}
