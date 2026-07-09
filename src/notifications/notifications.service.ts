import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(Notification.name)
        private notificationModel: Model<Notification>,
        private notificationsGateway: NotificationsGateway,
    ) { }

    async create(data: {
        userId: string;
        type: string;
        title: string;
        message: string;
        relatedAuctionId?: string;
    }): Promise<Notification> {
        const notification = new this.notificationModel(data);
        const saved = await notification.save();

        // Emit real-time notification
        this.notificationsGateway.sendNotification(data.userId, saved);

        return saved;
    }

    async findAllByUser(userId: string): Promise<any[]> {
        const notifications = await this.notificationModel
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
            .exec();
            
        return notifications.map(n => ({ ...n, id: n._id.toString() }));
    }

    async markAsRead(id: string, userId: string): Promise<any> {
        const notification = await this.notificationModel.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        ).lean().exec();

        if (notification) {
            return { ...notification, id: notification._id.toString() };
        }
        throw new NotFoundException('Notification not found');
    }

    async markAllAsRead(userId: string): Promise<void> {
        await this.notificationModel.updateMany(
            { userId, isRead: false },
            { isRead: true }
        ).exec();
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.notificationModel.deleteOne({ _id: id, userId }).exec();
    }
}
