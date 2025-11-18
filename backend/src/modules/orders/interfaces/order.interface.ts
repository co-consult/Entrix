import { CreateOrderDto, UpdateOrderDto, OrderQueryDto } from '../dto';
import { CreateOrderItemDto, UpdateOrderItemDto } from '../dto/order-item.dto';
import { OrderResponseDto, OrderListResponseDto, OrderItemResponseDto } from '../dto/order-response.dto';

export interface IOrdersService {
  // Order CRUD operations
  createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto>;
  findAllOrders(query: OrderQueryDto): Promise<OrderListResponseDto>;
  findOrderById(id: string): Promise<OrderResponseDto>;
  updateOrder(id: string, updateOrderDto: UpdateOrderDto): Promise<OrderResponseDto>;
  deleteOrder(id: string): Promise<void>;
  
  // Order status operations
  cancelOrder(id: string, reason?: string): Promise<OrderResponseDto>;
  refundOrder(id: string, refundData: any): Promise<OrderResponseDto>;
  confirmOrder(id: string): Promise<OrderResponseDto>;
  
  // Order items operations
  getOrderItems(orderId: string): Promise<OrderItemResponseDto[]>;
  addOrderItem(orderId: string, createItemDto: CreateOrderItemDto): Promise<OrderItemResponseDto>;
  updateOrderItem(orderId: string, itemId: string, updateItemDto: UpdateOrderItemDto): Promise<OrderItemResponseDto>;
  removeOrderItem(orderId: string, itemId: string): Promise<void>;
  
  // Analytics and reporting
  getOrderStats(organizerId?: string): Promise<any>;
  getOrderAnalytics(filters: any): Promise<any>;
  exportOrders(filters: any): Promise<Buffer>;
  
  // Invoice generation
  generateInvoice(orderId: string): Promise<Buffer>;
}

export interface IOrderRepository {
  create(data: any): Promise<any>;
  findMany(query: any): Promise<{ data: any[]; total: number }>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findByOrderNumber(orderNumber: string): Promise<any>;
  getStats(organizerId?: string): Promise<any>;
  getAnalytics(filters: any): Promise<any>;
}

export interface IOrderItemRepository {
  create(data: any): Promise<any>;
  findByOrderId(orderId: string): Promise<any[]>;
  findById(id: string): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  deleteByOrderId(orderId: string): Promise<void>;
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  channel?: string;
  user_id?: string;
  organizer_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
  orders_by_channel: Record<string, number>;
  revenue_by_month: Array<{ month: string; revenue: number; orders: number }>;
}

export interface OrderAnalytics {
  total_orders: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
  conversion_rate: number;
  top_products: Array<{ name: string; quantity: number; revenue: number }>;
  orders_by_status: Record<string, number>;
  orders_by_channel: Record<string, number>;
  revenue_trend: Array<{ date: string; revenue: number; orders: number }>;
  customer_segments: Record<string, number>;
}
