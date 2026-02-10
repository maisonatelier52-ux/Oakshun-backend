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
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Note: WS auth is trickier, simplified here for now

@WebSocketGateway({
    cors: {
        origin: '*', // Allow all origins for dev
    },
})
export class BiddingGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinAuction')
    handleJoinAuction(
        @MessageBody() auctionId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.join(`auction_${auctionId}`);
        console.log(`Client ${client.id} joined auction ${auctionId}`);
        return { event: 'joined', data: auctionId };
    }

    @SubscribeMessage('leaveAuction')
    handleLeaveAuction(
        @MessageBody() auctionId: string,
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`auction_${auctionId}`);
        console.log(`Client ${client.id} left auction ${auctionId}`);
    }

    // Method to broadcast new bids to specific auction room
    broadcastNewBid(auctionId: string, bidData: any) {
        this.server.to(`auction_${auctionId}`).emit('newBid', bidData);
    }

    // Method to broadcast auction end event
    broadcastAuctionEnded(auctionId: string, endData: any) {
        this.server.to(`auction_${auctionId}`).emit('auctionEnded', endData);
    }
}
