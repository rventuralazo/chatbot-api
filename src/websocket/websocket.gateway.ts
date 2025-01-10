import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
@WebSocketGateway({ cors: { origin: '*' } })
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  connectedUsers: {
    id: string;
    sockets: string[];
  }[] = [];
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
    const connectedUser = this.connectedUsers.findIndex((user) =>
      user.sockets.includes(client.id),
    );
    if (connectedUser !== -1) {
      this.connectedUsers[connectedUser].sockets = this.connectedUsers[
        connectedUser
      ].sockets.filter((socket) => socket !== client.id);
      if (this.connectedUsers[connectedUser].sockets.length === 0) {
        this.connectedUsers.splice(connectedUser, 1);
      }
    }

    console.log('Users Online', JSON.stringify(this.connectedUsers));
  }
  @SubscribeMessage('user_online')
  handleUserOnline(client: Socket, data: { id: string }) {
    const index = this.connectedUsers.findIndex((user) => user.id === data.id);
    if (index !== -1) {
      this.connectedUsers[index].sockets.push(client.id);
    } else {
      this.connectedUsers.push({ id: data.id, sockets: [client.id] });
    }
    console.log('Users Online', JSON.stringify(this.connectedUsers));
  }

  get usersOnline() {
    return this.connectedUsers;
  }
}
