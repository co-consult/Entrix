import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  InternalServerErrorException 
} from '@nestjs/common';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { LoggerService } from '../../../shared/logger/logger.service';
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
import { 
  IOrdersService, 
  OrderFilters, 
  OrderStats, 
  OrderAnalytics 
} from '../interfaces/order.interface';

@Injectable()
export class OrdersService implements IOrdersService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaService,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.createChildLogger('OrdersService');
  }

  // ============================================================================
  // ORDER CRUD OPERATIONS
  // ============================================================================

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('createOrder', {
      organizerId: createOrderDto.primary_organizer_id,
      totalAmount: createOrderDto.total_amount,
    });

    try {
      this.logger.info('Creating new order', JSON.stringify(createOrderDto));

      // Generate order number
      const orderNumber = await this.generateOrderNumber();

      // Create order with transaction
      const order = await this.prisma.orders.create({
        data: {
          ...createOrderDto,
          order_number: orderNumber,
        },
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      this.logger.endOperation('createOrder', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, createOrderDto);
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  async findAllOrders(query: OrderQueryDto): Promise<OrderListResponseDto> {
    const operationId = this.logger.startOperation('findAllOrders', query);

    try {
      const filters = this.buildOrderFilters(query);
      const { page, limit } = query;

      const [orders, total] = await Promise.all([
        this.prisma.orders.findMany({
          where: filters.where,
          orderBy: filters.orderBy,
          skip: (page - 1) * limit,
          take: limit,
          include: {
            users: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
                phone: true,
                avatar: true,
                is_active: true,
                created_at: true,
                updated_at: true,
              },
            },
            organizers: {
              select: {
                id: true,
                name: true,
                type: true,
                contact_email: true,
                contact_phone: true,
                status: true,
                created_at: true,
                updated_at: true,
              },
            },
            order_items: {
              include: {
                subscription_plans: true,
                ticket_types: true,
                events: true,
              },
            },
            payments: {
              include: {
                payment_methods: true,
              },
            },
          },
        }),
        this.prisma.orders.count({ where: filters.where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.endOperation('findAllOrders', operationId, true, undefined, { total, page, limit });
      
      return {
        orders: orders.map(order => this.mapOrderToResponse(order)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, query);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async findOrderById(id: string): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('findOrderById', { orderId: id });

    try {
      const order = await this.prisma.orders.findUnique({
        where: { id },
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      this.logger.endOperation('findOrderById', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('updateOrder', { orderId: id });

    try {
      // Check if order exists
      const existingOrder = await this.prisma.orders.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      const order = await this.prisma.orders.update({
        where: { id },
        data: updateOrderDto,
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      this.logger.endOperation('updateOrder', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id, updateData: updateOrderDto });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update order');
    }
  }

  async deleteOrder(id: string): Promise<void> {
    const operationId = this.logger.startOperation('deleteOrder', { orderId: id });

    try {
      // Check if order exists
      const existingOrder = await this.prisma.orders.findUnique({
        where: { id },
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Delete order (cascade will handle order_items)
      await this.prisma.orders.delete({
        where: { id },
      });

      this.logger.endOperation('deleteOrder', operationId, true, undefined, { orderId: id });
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete order');
    }
  }

  // ============================================================================
  // ORDER STATUS OPERATIONS
  // ============================================================================

  async cancelOrder(id: string, reason?: string): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('cancelOrder', { orderId: id, reason });

    try {
      // First, get the order with its items to check for subscriptions
      const existingOrder = await this.prisma.orders.findUnique({
        where: { id },
        include: {
          order_items: {
            where: {
              subscription_plan_id: { not: null }
            }
          }
        }
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Update the order status
      const order = await this.prisma.orders.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          metadata: {
            ...(await this.getOrderMetadata(id)),
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
          },
        },
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      // Invalidate associated subscriptions
      if (existingOrder.order_items.length > 0) {
        await this.invalidateSubscriptionsForOrder(id, 'CANCELLED', reason);
      }

      this.logger.endOperation('cancelOrder', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id, reason });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to cancel order');
    }
  }

  async refundOrder(id: string, refundData: any): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('refundOrder', { orderId: id, refundData });

    try {
      // First, get the order with its items to check for subscriptions
      const existingOrder = await this.prisma.orders.findUnique({
        where: { id },
        include: {
          order_items: {
            where: {
              subscription_plan_id: { not: null }
            }
          }
        }
      });

      if (!existingOrder) {
        throw new NotFoundException('Order not found');
      }

      // Update the order status
      const order = await this.prisma.orders.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...(await this.getOrderMetadata(id)),
            refund_data: refundData,
            refunded_at: new Date().toISOString(),
          },
        },
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      // Invalidate associated subscriptions
      if (existingOrder.order_items.length > 0) {
        await this.invalidateSubscriptionsForOrder(id, 'REFUNDED', refundData.reason);
      }

      this.logger.endOperation('refundOrder', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id, refundData });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to refund order');
    }
  }

  async confirmOrder(id: string): Promise<OrderResponseDto> {
    const operationId = this.logger.startOperation('confirmOrder', { orderId: id });

    try {
      const order = await this.prisma.orders.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmed_at: new Date(),
          metadata: {
            ...(await this.getOrderMetadata(id)),
            confirmed_at: new Date().toISOString(),
          },
        },
        include: {
          users: true,
          organizers: true,
          order_items: {
            include: {
              subscription_plans: true,
              ticket_types: true,
              events: true,
            },
          },
          payments: {
            include: {
              payment_methods: true,
            },
          },
        },
      });

      this.logger.endOperation('confirmOrder', operationId, true, undefined, { orderId: order.id });
      return this.mapOrderToResponse(order);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId: id });
      throw new InternalServerErrorException('Failed to confirm order');
    }
  }

  // ============================================================================
  // ORDER ITEMS OPERATIONS
  // ============================================================================

  async getAllOrderItems(query: any): Promise<any> {
    const operationId = this.logger.startOperation('getAllOrderItems', { query });

    try {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Add filters if provided
      if (query.search) {
        where.OR = [
          { item_name: { contains: query.search, mode: 'insensitive' } },
          { item_type: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.item_type) {
        where.item_type = query.item_type;
      }

      if (query.order_id) {
        where.order_id = query.order_id;
      }

      const [items, total] = await Promise.all([
        this.prisma.order_items.findMany({
          where,
          include: {
            subscription_plans: true,
            ticket_types: true,
            events: true,
            orders: {
              select: {
                id: true,
                order_number: true,
                status: true,
                created_at: true,
                users: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order_items.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      this.logger.endOperation('getAllOrderItems', operationId, true, undefined, { 
        total, 
        page, 
        limit, 
        totalPages,
        itemsCount: items.length 
      });

      return {
        items: items.map(item => this.mapOrderItemToResponse(item)),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { query });
      throw new InternalServerErrorException('Failed to fetch order items');
    }
  }

  async getOrderItems(orderId: string): Promise<OrderItemResponseDto[]> {
    const operationId = this.logger.startOperation('getOrderItems', { orderId });

    try {
      const items = await this.prisma.order_items.findMany({
        where: { order_id: orderId },
        include: {
          subscription_plans: true,
          ticket_types: true,
          events: true,
        },
        orderBy: { created_at: 'asc' },
      });

      this.logger.endOperation('getOrderItems', operationId, true, undefined, { orderId, itemsCount: items.length });
      return items.map(item => this.mapOrderItemToResponse(item));
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId });
      throw new InternalServerErrorException('Failed to fetch order items');
    }
  }

  async addOrderItem(orderId: string, createItemDto: CreateOrderItemDto): Promise<OrderItemResponseDto> {
    const operationId = this.logger.startOperation('addOrderItem', { orderId, itemData: createItemDto });

    try {
      // Calculate total price
      const totalPrice = (createItemDto.quantity * createItemDto.unit_price) - (createItemDto.discount_amount || 0);

      const item = await this.prisma.order_items.create({
        data: {
          ...createItemDto,
          order_id: orderId,
          total_price: totalPrice,
        },
        include: {
          subscription_plans: true,
          ticket_types: true,
          events: true,
        },
      });

      // Update order totals
      await this.updateOrderTotals(orderId);

      this.logger.endOperation('addOrderItem', operationId, true, undefined, { orderId, itemId: item.id });
      return this.mapOrderItemToResponse(item);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId, itemData: createItemDto });
      throw new InternalServerErrorException('Failed to add order item');
    }
  }

  async updateOrderItem(orderId: string, itemId: string, updateItemDto: UpdateOrderItemDto): Promise<OrderItemResponseDto> {
    const operationId = this.logger.startOperation('updateOrderItem', { orderId, itemId, updateData: updateItemDto });

    try {
      // Get current item to calculate new total
      const currentItem = await this.prisma.order_items.findFirst({
        where: { id: itemId, order_id: orderId },
      });

      if (!currentItem) {
        throw new NotFoundException('Order item not found');
      }

      // Calculate new total price
      const quantity = updateItemDto.quantity || currentItem.quantity;
      const unitPrice = updateItemDto.unit_price || currentItem.unit_price;
      const discountAmount = updateItemDto.discount_amount || currentItem.discount_amount;
      const totalPrice = (quantity * Number(unitPrice)) - Number(discountAmount);

      const item = await this.prisma.order_items.update({
        where: { id: itemId },
        data: {
          ...updateItemDto,
          total_price: totalPrice,
        },
        include: {
          subscription_plans: true,
          ticket_types: true,
          events: true,
        },
      });

      // Update order totals
      await this.updateOrderTotals(orderId);

      this.logger.endOperation('updateOrderItem', operationId, true, undefined, { orderId, itemId: item.id });
      return this.mapOrderItemToResponse(item);
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId, itemId, updateData: updateItemDto });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update order item');
    }
  }

  async removeOrderItem(orderId: string, itemId: string): Promise<void> {
    const operationId = this.logger.startOperation('removeOrderItem', { orderId, itemId });

    try {
      // Check if item exists
      const existingItem = await this.prisma.order_items.findFirst({
        where: { id: itemId, order_id: orderId },
      });

      if (!existingItem) {
        throw new NotFoundException('Order item not found');
      }

      // Delete item
      await this.prisma.order_items.delete({
        where: { id: itemId },
      });

      // Update order totals
      await this.updateOrderTotals(orderId);

      this.logger.endOperation('removeOrderItem', operationId, true, undefined, { orderId, itemId });
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId, itemId });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove order item');
    }
  }

  // ============================================================================
  // ANALYTICS AND REPORTING
  // ============================================================================

  async getOrderStats(organizerId?: string): Promise<OrderStats> {
    const operationId = this.logger.startOperation('getOrderStats', { organizerId });

    try {
      // Validate organizerId if provided - it should be a valid UUID
      let whereClause = {};
      if (organizerId && this.isValidUUID(organizerId)) {
        whereClause = { primary_organizer_id: organizerId };
      } else if (organizerId && !this.isValidUUID(organizerId)) {
        // If organizerId is provided but not a valid UUID, log warning and ignore it
        this.logger.warn(`Invalid organizerId provided: ${organizerId}. Ignoring filter.`);
      }

      const [
        totalOrders,
        totalRevenue,
        ordersByStatus,
        ordersByChannel,
        revenueByMonth,
      ] = await Promise.all([
        this.prisma.orders.count({ where: whereClause }),
        this.prisma.orders.aggregate({
          where: whereClause,
          _sum: { total_amount: true },
        }),
        this.prisma.orders.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true },
        }),
        this.prisma.orders.groupBy({
          by: ['purchase_channel'],
          where: whereClause,
          _count: { purchase_channel: true },
        }),
        this.getRevenueByMonth(whereClause),
      ]);

      const completedOrders = ordersByStatus.find(s => s.status === 'COMPLETED')?._count.status || 0;
      const pendingOrders = ordersByStatus.find(s => s.status === 'PENDING')?._count.status || 0;
      const cancelledOrders = ordersByStatus.find(s => s.status === 'CANCELLED')?._count.status || 0;
      const refundedOrders = ordersByStatus.find(s => s.status === 'REFUNDED')?._count.status || 0;

      const averageOrderValue = totalOrders > 0 ? Number(totalRevenue._sum.total_amount || 0) / totalOrders : 0;

      const stats: OrderStats = {
        total_orders: totalOrders,
        total_revenue: Number(totalRevenue._sum.total_amount || 0),
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        cancelled_orders: cancelledOrders,
        refunded_orders: refundedOrders,
        average_order_value: averageOrderValue,
        orders_by_status: ordersByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        orders_by_channel: ordersByChannel.reduce((acc, item) => {
          acc[item.purchase_channel] = item._count.purchase_channel;
          return acc;
        }, {} as Record<string, number>),
        revenue_by_month: revenueByMonth,
      };

      this.logger.endOperation('getOrderStats', operationId, true, undefined, { organizerId, stats });
      return stats;
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { organizerId });
      throw new InternalServerErrorException('Failed to fetch order stats');
    }
  }

  async getOrderAnalytics(filters: any): Promise<OrderAnalytics> {
    const operationId = this.logger.startOperation('getOrderAnalytics', filters);

    try {
      // Implementation for detailed analytics
      // This would include more complex queries for trends, customer segments, etc.
      
      const basicStats = await this.getOrderStats(filters.organizer_id);
      
      const analytics: OrderAnalytics = {
        total_orders: basicStats.total_orders,
        total_revenue: basicStats.total_revenue,
        total_items_sold: 0, // Would need to calculate from order_items
        average_order_value: basicStats.average_order_value,
        conversion_rate: 0, // Would need to calculate from funnel data
        top_products: [], // Would need to query order_items
        orders_by_status: basicStats.orders_by_status,
        orders_by_channel: basicStats.orders_by_channel,
        revenue_trend: [], // Would need time-series data
        customer_segments: {}, // Would need customer analysis
      };

      this.logger.endOperation('getOrderAnalytics', operationId, true, undefined, { filters, analytics });
      return analytics;
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, filters);
      throw new InternalServerErrorException('Failed to fetch order analytics');
    }
  }

  async exportOrders(filters: any): Promise<Buffer> {
    const operationId = this.logger.startOperation('exportOrders', filters);

    try {
      // Implementation for Excel/CSV export
      // This would use a library like xlsx or csv-writer
      
      const orders = await this.prisma.orders.findMany({
        where: this.buildOrderFilters(filters).where,
        include: {
          users: true,
          organizers: true,
          order_items: true,
        },
      });

      // Convert to CSV/Excel format
      // For now, return empty buffer - would implement actual export logic
      const exportData = Buffer.from('Order export data would go here');
      
      this.logger.endOperation('exportOrders', operationId, true, undefined, { filters, exportSize: exportData.length });
      return exportData;
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, filters);
      throw new InternalServerErrorException('Failed to export orders');
    }
  }

  async generateInvoice(orderId: string): Promise<Buffer> {
    const operationId = this.logger.startOperation('generateInvoice', { orderId });

    try {
      const order = await this.findOrderById(orderId);
      
      // Generate a simple HTML invoice
      const invoiceHtml = this.generateInvoiceHtml(order);
      
      // For now, return HTML as buffer - in production, use puppeteer to convert to PDF
      const invoiceData = Buffer.from(invoiceHtml, 'utf-8');
      
      this.logger.endOperation('generateInvoice', operationId, true, undefined, { orderId, invoiceSize: invoiceData.length });
      return invoiceData;
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId });
      throw new InternalServerErrorException('Failed to generate invoice');
    }
  }

  private generateInvoiceHtml(order: any): string {
    const orderDate = new Date(order.created_at).toLocaleDateString('fr-FR');
    const totalAmount = order.total_amount || 0;
    const currency = order.currency || 'TND';
    
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${order.order_number}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .customer-info { margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FACTURE</h1>
        <h2>ENTRIX</h2>
    </div>
    
    <div class="invoice-info">
        <div>
            <strong>Numéro de facture:</strong> ${order.order_number}<br>
            <strong>Date:</strong> ${orderDate}
        </div>
        <div>
            <strong>Commande:</strong> ${order.order_number}<br>
            <strong>Statut:</strong> ${order.status}
        </div>
    </div>
    
    <div class="customer-info">
        <h3>Informations client</h3>
        <p>
            <strong>Nom:</strong> ${order.user?.first_name || ''} ${order.user?.last_name || ''}<br>
            <strong>Email:</strong> ${order.user?.email || order.guest_email || 'N/A'}<br>
            <strong>Téléphone:</strong> ${order.user?.phone || order.guest_phone || 'N/A'}
        </p>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Article</th>
                <th>Quantité</th>
                <th>Prix unitaire</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${order.items?.map(item => `
                <tr>
                    <td>${item.item_name || item.ticket_type?.name || item.subscription_plan?.name || 'Article'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit_price} ${currency}</td>
                    <td>${item.total_price} ${currency}</td>
                </tr>
            `).join('') || '<tr><td colspan="4">Aucun article</td></tr>'}
        </tbody>
    </table>
    
    <div class="total">
        <p><strong>Total: ${totalAmount} ${currency}</strong></p>
    </div>
    
    <div style="margin-top: 50px; text-align: center; color: #666;">
        <p>Merci pour votre commande!</p>
        <p>ENTRIX - Plateforme de gestion d'événements</p>
    </div>
</body>
</html>`;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async generateOrderNumber(): Promise<string> {
    const lastOrder = await this.prisma.orders.findFirst({
      where: {
        order_number: {
          startsWith: 'ORD_'
        }
      },
      orderBy: {
        order_number: 'desc'
      },
      select: {
        order_number: true
      }
    });

    let nextNumber = 1;
    
    if (lastOrder) {
      const match = lastOrder.order_number.match(/ORD_(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    const formattedNumber = nextNumber.toString().padStart(8, '0');
    return `ORD_${formattedNumber}`;
  }

  private buildOrderFilters(query: OrderQueryDto): { where: any; orderBy: any } {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { order_number: { contains: query.search, mode: 'insensitive' } },
        { guest_name: { contains: query.search, mode: 'insensitive' } },
        { guest_email: { contains: query.search, mode: 'insensitive' } },
        { users: { first_name: { contains: query.search, mode: 'insensitive' } } },
        { users: { last_name: { contains: query.search, mode: 'insensitive' } } },
        { users: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.channel) {
      where.purchase_channel = query.channel;
    }

    if (query.user_id) {
      where.user_id = query.user_id;
    }

    if (query.organizer_id) {
      where.primary_organizer_id = query.organizer_id;
    }

    if (query.date_from || query.date_to) {
      where.created_at = {};
      if (query.date_from) {
        where.created_at.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        where.created_at.lte = new Date(query.date_to);
      }
    }

    if (query.min_amount || query.max_amount) {
      where.total_amount = {};
      if (query.min_amount) {
        where.total_amount.gte = query.min_amount;
      }
      if (query.max_amount) {
        where.total_amount.lte = query.max_amount;
      }
    }

    const orderBy: any = {};
    if (query.sort_by) {
      orderBy[query.sort_by] = query.sort_order || 'desc';
    } else {
      orderBy.created_at = 'desc';
    }

    return { where, orderBy };
  }

  private async updateOrderTotals(orderId: string): Promise<void> {
    const items = await this.prisma.order_items.findMany({
      where: { order_id: orderId },
    });

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * Number(item.unit_price)), 0);
    const totalDiscount = items.reduce((sum, item) => sum + Number(item.discount_amount || 0), 0);
    const totalAmount = subtotal - totalDiscount;

    await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        subtotal_amount: subtotal,
        discount_amount: totalDiscount,
        total_amount: totalAmount,
      },
    });
  }

  private async getOrderMetadata(orderId: string): Promise<any> {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: { metadata: true },
    });

    return order?.metadata || {};
  }

  private async getRevenueByMonth(whereClause: any): Promise<Array<{ month: string; revenue: number; orders: number }>> {
    // Implementation for monthly revenue data
    // This would use Prisma's date aggregation features
    return [];
  }

  private async invalidateSubscriptionsForOrder(orderId: string, reason: string, details?: string): Promise<void> {
    const operationId = this.logger.startOperation('invalidateSubscriptionsForOrder', { orderId, reason });

    try {
      // Find all subscriptions that were created from this order
      // We need to find subscriptions that were created around the same time as the order
      // and match the user and organizer
      const order = await this.prisma.orders.findUnique({
        where: { id: orderId },
        include: {
          order_items: {
            where: {
              subscription_plan_id: { not: null }
            },
            include: {
              subscription_plans: true
            }
          }
        }
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for subscription invalidation`);
        return;
      }

      // Find subscriptions that match the order's user and organizer
      // and were created around the same time (within 1 hour of order creation)
      const orderCreatedAt = new Date(order.created_at);
      const oneHourAfter = new Date(orderCreatedAt.getTime() + 60 * 60 * 1000);
      const oneHourBefore = new Date(orderCreatedAt.getTime() - 60 * 60 * 1000);

      const subscriptionsToInvalidate = await this.prisma.subscriptions.findMany({
        where: {
          user_id: order.user_id,
          organizer_id: order.primary_organizer_id,
          created_at: {
            gte: oneHourBefore,
            lte: oneHourAfter
          },
          status: {
            in: ['ACTIVE', 'PENDING']
          }
        }
      });

      if (subscriptionsToInvalidate.length > 0) {
        // Update subscriptions to CANCELLED status
        await this.prisma.subscriptions.updateMany({
          where: {
            id: {
              in: subscriptionsToInvalidate.map(sub => sub.id)
            }
          },
          data: {
            status: 'CANCELLED',
            metadata: {
              ...(subscriptionsToInvalidate[0].metadata as any || {}),
              invalidation_reason: reason,
              invalidation_details: details,
              invalidated_at: new Date().toISOString(),
              invalidated_by_order: orderId
            }
          }
        });

        this.logger.info(`Invalidated ${subscriptionsToInvalidate.length} subscriptions for order ${orderId}. Reason: ${reason}. Details: ${details}. Subscription IDs: ${subscriptionsToInvalidate.map(sub => sub.id).join(', ')}`);
      } else {
        this.logger.info(`No subscriptions found to invalidate for order ${orderId}`);
      }

      this.logger.endOperation('invalidateSubscriptionsForOrder', operationId, true, undefined, {
        orderId,
        subscriptionsInvalidated: subscriptionsToInvalidate.length
      });
    } catch (error) {
      this.logger.logErrorEvent(error, 'OrdersService', operationId, { orderId, reason, details });
      // Don't throw error here as it shouldn't prevent order cancellation/refund
      this.logger.error(`Failed to invalidate subscriptions for order ${orderId}: ${error.message}`);
    }
  }

  private mapOrderToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      order_number: order.order_number,
      user_id: order.user_id,
      primary_organizer_id: order.primary_organizer_id,
      status: order.status,
      subtotal_amount: order.subtotal_amount,
      discount_amount: order.discount_amount,
      tax_amount: order.tax_amount,
      processing_fee: order.processing_fee,
      total_amount: order.total_amount,
      currency: order.currency,
      purchase_channel: order.purchase_channel,
      coupon_code: order.coupon_code,
      guest_name: order.guest_name,
      guest_email: order.guest_email,
      guest_phone: order.guest_phone,
      notes: order.notes,
      metadata: order.metadata,
      confirmed_at: order.confirmed_at,
      expires_at: order.expires_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
      user: order.users ? {
        id: order.users.id,
        email: order.users.email,
        first_name: order.users.first_name,
        last_name: order.users.last_name,
        phone: order.users.phone,
        avatar: order.users.avatar,
        is_active: order.users.is_active,
        created_at: order.users.created_at,
        updated_at: order.users.updated_at,
      } : undefined,
      organizer: order.organizers ? {
        id: order.organizers.id,
        name: order.organizers.name,
        type: order.organizers.type,
        contact_email: order.organizers.contact_email,
        contact_phone: order.organizers.contact_phone,
        status: order.organizers.status,
        created_at: order.organizers.created_at,
        updated_at: order.organizers.updated_at,
      } : undefined,
      items: order.order_items?.map((item: any) => this.mapOrderItemToResponse(item)),
      payments: order.payments?.map((payment: any) => this.mapPaymentToResponse(payment)),
    };
  }

  private mapOrderItemToResponse(item: any): OrderItemResponseDto {
    return {
      id: item.id,
      order_id: item.order_id,
      item_type: item.item_type,
      item_name: item.item_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      total_price: item.total_price,
      currency: item.currency,
      subscription_plan_id: item.subscription_plan_id,
      ticket_type_id: item.ticket_type_id,
      event_id: item.event_id,
      item_configuration: item.item_configuration,
      metadata: item.metadata,
      created_at: item.created_at,
      updated_at: item.updated_at,
      subscription_plan: item.subscription_plans,
      ticket_type: item.ticket_types,
      event: item.events,
    };
  }

  private mapPaymentToResponse(payment: any): any {
    return {
      id: payment.id,
      payment_number: payment.payment_number,
      order_id: payment.order_id,
      payment_method_id: payment.payment_method_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      external_transaction_id: payment.external_transaction_id,
      processing_fee: payment.processing_fee,
      net_amount: payment.net_amount,
      payment_date: payment.payment_date,
      expires_at: payment.expires_at,
      gateway_data: payment.gateway_data,
      metadata: payment.metadata,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      payment_method: payment.payment_methods,
    };
  }
}
