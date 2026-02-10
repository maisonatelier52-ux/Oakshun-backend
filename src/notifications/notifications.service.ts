import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private notificationsRepository: Repository<Notification>,
        private notificationsGateway: NotificationsGateway,
    ) { }

    async create(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        relatedAuctionId?: string;
    }): Promise<Notification> {
        const notification = this.notificationsRepository.create(data);
        const saved = await this.notificationsRepository.save(notification);

        // Emit real-time notification
        this.notificationsGateway.sendNotification(data.userId, saved);

        return saved;
    }

    async findAllByUser(userId: string): Promise<Notification[]> {
        return this.notificationsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }

    async markAsRead(id: string, userId: string): Promise<Notification> {
        const notification = await this.notificationsRepository.findOne({
            where: { id, userId },
        });
        if (notification) {
            notification.isRead = true;
            return this.notificationsRepository.save(notification);
        }
        throw new Error('Notification not found');
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationsRepository.update({ userId, isRead: false }, { isRead: true });
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.notificationsRepository.delete({ id, userId });
    }
}
