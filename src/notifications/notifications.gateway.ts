import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Notification Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Notification Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribeToNotifications')
    handleSubscribe(
        @MessageBody() userId: string,
        @ConnectedSocket() client: Socket,
    ) {
        if (userId) {
            client.join(`user_notifications_${userId}`);
            console.log(`User ${userId} subscribed to real-time notifications`);
            return { event: 'subscribed', data: userId };
        }
    }

    sendNotification(userId: string, notification: any) {
        this.server.to(`user_notifications_${userId}`).emit('notification', notification);
    }
}
