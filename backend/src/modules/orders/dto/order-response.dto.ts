import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus, PurchaseChannel } from './create-order.dto';
import { OrderItemType } from './order-item.dto';

export class OrderItemResponseDto {
  @ApiProperty({ description: 'Order item ID' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  order_id: string;

  @ApiProperty({ description: 'Item type', enum: OrderItemType })
  item_type: OrderItemType;

  @ApiProperty({ description: 'Item name' })
  item_name: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiProperty({ description: 'Unit price' })
  unit_price: number;

  @ApiProperty({ description: 'Discount amount' })
  discount_amount: number;

  @ApiProperty({ description: 'Total price' })
  total_price: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Subscription plan ID' })
  subscription_plan_id?: string;

  @ApiPropertyOptional({ description: 'Ticket type ID' })
  ticket_type_id?: string;

  @ApiPropertyOptional({ description: 'Event ID' })
  event_id?: string;

  @ApiPropertyOptional({ description: 'Item configuration' })
  item_configuration?: any;

  @ApiPropertyOptional({ description: 'Item metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;

  // Relations
  @ApiPropertyOptional({ description: 'Subscription plan details' })
  subscription_plan?: any;

  @ApiPropertyOptional({ description: 'Ticket type details' })
  ticket_type?: any;

  @ApiPropertyOptional({ description: 'Event details' })
  event?: any;
}

export class PaymentResponseDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Payment number' })
  payment_number: string;

  @ApiProperty({ description: 'Order ID' })
  order_id: string;

  @ApiProperty({ description: 'Payment method ID' })
  payment_method_id: string;

  @ApiProperty({ description: 'Amount' })
  amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  external_transaction_id?: string;

  @ApiProperty({ description: 'Processing fee' })
  processing_fee: number;

  @ApiProperty({ description: 'Net amount' })
  net_amount: number;

  @ApiPropertyOptional({ description: 'Payment date' })
  payment_date?: Date;

  @ApiPropertyOptional({ description: 'Expires at' })
  expires_at?: Date;

  @ApiPropertyOptional({ description: 'Gateway data' })
  gateway_data?: any;

  @ApiPropertyOptional({ description: 'Payment metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;

  // Relations
  @ApiPropertyOptional({ description: 'Payment method details' })
  payment_method?: any;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'First name' })
  first_name: string;

  @ApiProperty({ description: 'Last name' })
  last_name: string;

  @ApiPropertyOptional({ description: 'Phone' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Avatar' })
  avatar?: string;

  @ApiProperty({ description: 'Is active' })
  is_active: boolean;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;
}

export class OrganizerResponseDto {
  @ApiProperty({ description: 'Organizer ID' })
  id: string;

  @ApiProperty({ description: 'Organizer name' })
  name: string;

  @ApiProperty({ description: 'Organizer type' })
  type: string;

  @ApiProperty({ description: 'Contact email' })
  contact_email: string;

  @ApiPropertyOptional({ description: 'Contact phone' })
  contact_phone?: string;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;
}

export class OrderResponseDto {
  @ApiProperty({ description: 'Order ID' })
  id: string;

  @ApiProperty({ description: 'Order number' })
  order_number: string;

  @ApiPropertyOptional({ description: 'User ID' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Primary organizer ID' })
  primary_organizer_id?: string;

  @ApiProperty({ description: 'Order status', enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ description: 'Subtotal amount' })
  subtotal_amount: number;

  @ApiProperty({ description: 'Discount amount' })
  discount_amount: number;

  @ApiProperty({ description: 'Tax amount' })
  tax_amount: number;

  @ApiProperty({ description: 'Processing fee' })
  processing_fee: number;

  @ApiProperty({ description: 'Total amount' })
  total_amount: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Purchase channel', enum: PurchaseChannel })
  purchase_channel: PurchaseChannel;

  @ApiPropertyOptional({ description: 'Coupon code' })
  coupon_code?: string;

  @ApiPropertyOptional({ description: 'Guest name' })
  guest_name?: string;

  @ApiPropertyOptional({ description: 'Guest email' })
  guest_email?: string;

  @ApiPropertyOptional({ description: 'Guest phone' })
  guest_phone?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: any;

  @ApiPropertyOptional({ description: 'Confirmed at' })
  confirmed_at?: Date;

  @ApiPropertyOptional({ description: 'Expires at' })
  expires_at?: Date;

  @ApiProperty({ description: 'Created at' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at' })
  updated_at: Date;

  // Relations
  @ApiPropertyOptional({ description: 'User details' })
  user?: UserResponseDto;

  @ApiPropertyOptional({ description: 'Organizer details' })
  organizer?: OrganizerResponseDto;

  @ApiPropertyOptional({ description: 'Order items' })
  items?: OrderItemResponseDto[];

  @ApiPropertyOptional({ description: 'Payments' })
  payments?: PaymentResponseDto[];
}

export class OrderListResponseDto {
  @ApiProperty({ description: 'Orders list', type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}
