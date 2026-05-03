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
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { OrdersEntity } from './orders.entity';
import { OrderTrackingService } from '../order-tracking/order-tracking.service';
import { OrderTrackingEntity } from '../order-tracking/order-tracking.entity';
import { JwtAuthGuard } from '../../common/guards/auth.guard';
import { UserRoleGuard } from '../../common/guards/user-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser, UserRole } from '../auth/types/auth.types';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderTrackingService: OrderTrackingService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(JwtAuthGuard, UserRoleGuard)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({
    status: 200,
    description: 'Orders found',
    type: [OrdersEntity],
  })
  @ApiResponse({ status: 404, description: 'Orders not found' })
  getAll(@Query() query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.ordersService.getOrders({ page, limit }, undefined);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
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
  async create(
    @Body() dto: CreateOrderDto,
    @Request() req: { user: AuthUser },
  ): Promise<OrdersEntity> {
    this.ordersService.assertCanCreateOrderForUser(dto.userId, req.user);
    return this.ordersService.createOrder(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order by id' })
  @ApiResponse({ status: 200, description: 'Order found', type: OrdersEntity })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: { user: AuthUser },
  ): Promise<OrdersEntity> {
    const order = await this.ordersService.getOrderById(id);
    this.ordersService.assertCanAccessOrder(order, req.user);
    return order;
  }

  @Get(':id/payment-status')
  @UseGuards(JwtAuthGuard)
  async getOrderPaymentStatus(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Request() req: { user: AuthUser },
  ) {
    const order = await this.ordersService.getOrderById(orderId);
    this.ordersService.assertCanAccessOrder(order, req.user);
    if (!order.paymentId) {
      throw new NotFoundException(
        'Order has no payment linked. Create the order first so that payment is authorized.',
      );
    }
    return this.ordersService.getPaymentStatus(order.paymentId);
  }

  @Patch(':id/courier')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseGuards(JwtAuthGuard, UserRoleGuard)
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
