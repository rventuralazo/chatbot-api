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
import { WebsocketGateway } from '../websocket/websocket.gateway';
// import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';

@Controller('api/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly chatService: ChatService,
    private readonly websocket: WebsocketGateway,
  ) {}

  @Get(':id')
  async getChat(@Param('id') id: string) {
    const chat = await this.supabase.client
      .from('chat')
      .select(`*, assignedTo(*)`)
      .eq('id', id)
      .single();
    return chat.data;
  }
  @Get(':id/event-log')
  async getChatEventLog(@Param('id') id: string) {
    const eventLog = await this.supabase.client
      .from('chat_event_log')
      .select()
      .eq('chat', id);
    return eventLog.data;
  }

  @Get()
  async getChatList(
    @Query() pageOptions: PageOptionsDto,
    @Query('mode') mode: string = 'both',
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.chatService.getChatList(pageOptions, mode, assignedTo);
  }

  @Get(':id/messages')
  async getChatMessages(
    @Param('id') id: string,
    @Query() pageOptions: PageOptionsDto,
  ) {
    const messagesQuery = this.supabase.client.from('chat_message');
    await messagesQuery.select('*', { count: 'exact', head: true });

    const messages = await messagesQuery
      .select(`*, in_response_of(*)`)
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
    @Body() body: { number: string; message: string; foward?: string },
  ) {
    try {
      const result = await axios.post(
        `${process.env.BUILDERBOT_URL}/v1/messages`,
        {
          number: body.number,
          message: body.message,
          quoted: body.foward,
        },
      );
      await this.chatService.saveChatMessage(id, {
        message: body.message,
        isBot: true,
        messageId: result.data.key?.id,
        inReponseOf:
          result.data?.message?.extendedTextMessage?.contextInfo?.stanzaId,
        metadata: result.data,
      });
    } catch (error) {
      console.log(error);
    }
  }
  @Get(':id/pause')
  async pauseChat(@Param('id') id: number) {
    console.log('Pausing chat', id);
    return await this.chatService.pauseChat(id);
  }
  @Get(':id/resume')
  async resumeChat(@Param('id') id: number) {
    return await this.chatService.resumeChat(id);
  }
  @Get(':id/mark-as-read')
  async markMessageAsRead(@Param('id') id: number) {
    return await this.chatService.markMessageAsRead(id);
  }
  @Post(':id/notes')
  async addNote(@Param('id') id: number, @Body() body: { note: string }) {
    return await this.chatService.updateChatNote(id, body.note);
  }
}
