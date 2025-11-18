import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService } from '../services/orders.service';
import { 
  CreateOrderDto, 
  UpdateOrderDto, 
  OrderQueryDto 
} from '../dto';
import { 
  CreateOrderItemDto, 
  UpdateOrderItemDto 
} from '../dto/order-item.dto';
import { 
  OrderResponseDto, 
  OrderListResponseDto, 
  OrderItemResponseDto 
} from '../dto/order-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(createOrderDto);
  }

  @Get()
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get all orders with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully', type: OrderListResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAllOrders(@Query() query: OrderQueryDto): Promise<OrderListResponseDto> {
    return this.ordersService.findAllOrders(query);
  }

  @Get('stats')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'organizer_id', required: false, description: 'Filter by organizer ID' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrderStats(@Query('organizer_id') organizerId?: string) {
    return this.ordersService.getOrderStats(organizerId);
  }

  @Get('analytics')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get detailed order analytics' })
  @ApiResponse({ status: 200, description: 'Order analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrderAnalytics(@Query() filters: any) {
    return this.ordersService.getOrderAnalytics(filters);
  }

  @Get('export')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Export orders to Excel/CSV' })
  @ApiResponse({ status: 200, description: 'Orders exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="orders.xlsx"')
  async exportOrders(@Query() filters: any, @Res() res: Response) {
    const buffer = await this.ordersService.exportOrders(filters);
    res.send(buffer);
  }

  @Get('items')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get all order items with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Order items retrieved successfully', type: [OrderItemResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAllOrderItems(@Query() query: any): Promise<any> {
    return this.ordersService.getAllOrderItems(query);
  }

  @Get(':id')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findOrderById(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.findOrderById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, updateOrderDto);
  }

  @Put(':id')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Update order (PUT)' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateOrderPut(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrder(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 204, description: 'Order deleted successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteOrder(@Param('id') id: string): Promise<void> {
    return this.ordersService.deleteOrder(id);
  }

  @Post(':id/cancel')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(id, reason);
  }

  @Post(':id/refund')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Refund order' })
  @ApiResponse({ status: 200, description: 'Order refunded successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async refundOrder(
    @Param('id') id: string,
    @Body() refundData: any,
  ): Promise<OrderResponseDto> {
    return this.ordersService.refundOrder(id, refundData);
  }

  @Post(':id/confirm')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Confirm order' })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async confirmOrder(@Param('id') id: string): Promise<OrderResponseDto> {
    return this.ordersService.confirmOrder(id);
  }

  @Get(':id/invoice')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Generate order invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="invoice.pdf"')
  async generateInvoice(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.ordersService.generateInvoice(id);
    res.send(buffer);
  }

  // ============================================================================
  // ORDER ITEMS ENDPOINTS
  // ============================================================================

  @Get(':id/items')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Get order items' })
  @ApiResponse({ status: 200, description: 'Order items retrieved successfully', type: [OrderItemResponseDto] })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getOrderItems(@Param('id') orderId: string): Promise<OrderItemResponseDto[]> {
    return this.ordersService.getOrderItems(orderId);
  }

  @Post(':id/items')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Add item to order' })
  @ApiResponse({ status: 201, description: 'Order item added successfully', type: OrderItemResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async addOrderItem(
    @Param('id') orderId: string,
    @Body() createItemDto: CreateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.addOrderItem(orderId, createItemDto);
  }

  @Patch(':id/items/:itemId')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @ApiOperation({ summary: 'Update order item' })
  @ApiResponse({ status: 200, description: 'Order item updated successfully', type: OrderItemResponseDto })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateOrderItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    return this.ordersService.updateOrderItem(orderId, itemId, updateItemDto);
  }

  @Delete(':id/items/:itemId')
  @Roles('ADMIN', 'ORGANIZER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove item from order' })
  @ApiResponse({ status: 204, description: 'Order item removed successfully' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async removeOrderItem(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
  ): Promise<void> {
    return this.ordersService.removeOrderItem(orderId, itemId);
  }
}
