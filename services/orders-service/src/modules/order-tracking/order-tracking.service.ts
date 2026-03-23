import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderTrackingEntity } from './order-tracking.entity';

@Injectable()
export class OrderTrackingService {
  constructor(
    @InjectRepository(OrderTrackingEntity)
    private readonly repo: Repository<OrderTrackingEntity>,
  ) {}

  async getByOrderId(orderId: string): Promise<OrderTrackingEntity | null> {
    return this.repo.findOne({
      where: { orderId },
      relations: ['courier'],
    });
  }

  async assignCourier(
    orderId: string,
    courierId: string,
  ): Promise<OrderTrackingEntity> {
    const existing = await this.repo.findOne({ where: { orderId } });
    const now = new Date();
    if (existing) {
      existing.courierId = courierId;
      existing.lastUpdated = now;
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({
        orderId,
        courierId,
        lat: 0,
        lng: 0,
        lastUpdated: now,
      }),
    );
  }

  async updateLocation(
    orderId: string,
    lat: number,
    lng: number,
    courierId?: string | null,
  ): Promise<OrderTrackingEntity> {
    const existing = await this.repo.findOne({ where: { orderId } });
    const now = new Date();

    if (existing) {
      existing.lat = lat;
      existing.lng = lng;
      existing.lastUpdated = now;
      if (courierId !== undefined) existing.courierId = courierId ?? null;
      return this.repo.save(existing);
    }

    const entity = this.repo.create({
      orderId,
      lat,
      lng,
      lastUpdated: now,
      ...(courierId !== undefined && { courierId: courierId ?? null }),
    });
    return this.repo.save(entity);
  }
}
