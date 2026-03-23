import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { OrdersEntity } from './orders.entity';
import { OrderTrackingService } from '../order-tracking/order-tracking.service';
import { OrderTrackingEntity } from '../order-tracking/order-tracking.entity';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderTrackingService: OrderTrackingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'Orders found',
    type: [OrdersEntity],
  })
  @ApiResponse({ status: 404, description: 'Orders not found' })
  getAll() {
    return this.ordersService.getOrders();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created',
    type: OrdersEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Related entity not found' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict (e.g. insufficient stock or duplicate idempotency key)',
  })
  create(@Body() dto: CreateOrderDto): Promise<OrdersEntity> {
    return this.ordersService.createOrder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrdersEntity })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getById(@Param('id', new ParseUUIDPipe()) id: string): Promise<OrdersEntity> {
    return this.ordersService.getOrderById(id);
  }

  @Get(':id/payment-status')
  async getOrderPaymentStatus(
    @Param('id', new ParseUUIDPipe()) orderId: string,
  ) {
    const order = await this.ordersService.getOrderById(orderId);
    if (!order.paymentId) {
      throw new NotFoundException(
        'Order has no payment linked. Create the order first so that payment is authorized.',
      );
    }
    return this.ordersService.getPaymentStatus(order.paymentId);
  }

  @Patch(':id/courier')
  @ApiOperation({ summary: 'Assign courier to order' })
  @ApiBody({ type: AssignCourierDto })
  @ApiResponse({
    status: 200,
    description: 'Courier assigned',
    type: OrderTrackingEntity,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async assignCourier(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body() dto: AssignCourierDto,
  ): Promise<OrderTrackingEntity> {
    await this.ordersService.getOrderById(orderId); // 404 if order does not exist
    await this.ordersService.setOrderCourierId(orderId, dto.courierId);
    return this.orderTrackingService.assignCourier(orderId, dto.courierId);
  }
}
