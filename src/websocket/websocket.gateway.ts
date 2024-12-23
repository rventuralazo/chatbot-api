import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  afterInit() {
    this.logger.log('Initialized');
  }
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;
  handleConnection(client: Socket) {
    console.log('Client connected', client.id);
  }
  handleDisconnect(client: Socket) {
    console.log('Client disconnected', client.id);
  }
}
