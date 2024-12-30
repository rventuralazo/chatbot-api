import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ChatService } from './chat.service';
import axios from 'axios';
import { PageOptionsDto } from '../common/dtos/page-options.dto';
import { PageDto, PageMetaDto } from '../common/dtos/page-meta.dto';
import { AuthGuard } from '@nestjs/passport';
// import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

@Controller('api/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly chatService: ChatService,
  ) {}

  @Get(':id')
  async getChat(@Param('id') id: string) {
    const chat = await this.supabase
      .getSupabase()
      .from('chat')
      .select()
      .eq('id', id)
      .single();
    return chat.data;
  }

  @Get()
  async getChatList(@Query() pageOptions: PageOptionsDto) {
    const query = this.supabase.getSupabase().from('chat');
    await query.select('*', { count: 'exact', head: true });

    const chats = await query
      .select()
      .range(+pageOptions.skip, +(pageOptions.skip + (pageOptions.take - 1)));
    const itemCount = chats.count;
    const data = chats.data;
    const chatList = [];
    for (const chat of data) {
      const messages = await this.supabase
        .getSupabase()
        .from('chat_message')
        .select()
        .order('created_at', { ascending: false })
        .limit(1)
        .eq('chat', chat.id);
      chatList.push({
        ...chat,
        lastMessage: messages.data[0],
      });
    }

    const meta = new PageMetaDto({ itemCount, pageOptionsDto: pageOptions });

    return new PageDto(chatList, meta);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') id: string,
    @Query() pageOptions: PageOptionsDto,
  ) {
    const messagesQuery = this.supabase.getSupabase().from('chat_message');
    await messagesQuery.select('*', { count: 'exact', head: true });

    const messages = await messagesQuery
      .select()
      .order('created_at', { ascending: false })
      .range(+pageOptions.skip, +(pageOptions.skip + (pageOptions.take - 1)))
      .eq('chat', id);
    const itemCount = messages.count;
    const data = messages.data;

    const meta = new PageMetaDto({ itemCount, pageOptionsDto: pageOptions });

    return new PageDto(data, meta);
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
      isBot: true,
    });
  }
  @Get(':id/pause')
  async pauseChat(@Param('id') id: number) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ paused: true })
      .eq('id', id);
  }
  @Get(':id/resume')
  async resumeChat(@Param('id') id: number) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ paused: false })
      .eq('id', id);
  }
  @Get(':id/mark-as-read')
  async markMessageAsRead(@Param('id') id: number) {
    return await this.supabase
      .getSupabase()
      .from('chat_message')
      .update({ isRead: true })
      .eq('id', id);
  }
  @Post(':id/notes')
  async addNote(@Param('id') id: number, @Body() body: { note: string }) {
    return await this.supabase
      .getSupabase()
      .from('chat')
      .update({ notes: body.note })
      .eq('id', id);
  }
}
