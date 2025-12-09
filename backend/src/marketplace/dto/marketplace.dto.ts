import {
    IsString,
    IsNumber,
    IsOptional,
    IsArray,
    IsEnum,
    IsBoolean,
    IsUUID,
    Min,
    Max,
    IsUrl,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

// =============================================
// Enums
// =============================================
export enum ProductCategory {
    EQUIPMENT = 'equipment',
    BEAUTY_PRODUCT = 'beauty_product',
    ACCESSORY = 'accessory',
    OTHER = 'other',
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    READY_FOR_PICKUP = 'ready_for_pickup',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

export enum PaymentMethod {
    CASH_ON_DELIVERY = 'cash_on_delivery',
    CASH_ON_PICKUP = 'cash_on_pickup',
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
}

export enum DeliveryMethod {
    DELIVERY = 'delivery',
    PICKUP = 'pickup',
}

// =============================================
// Product DTOs
// =============================================
export class CreateProductDto {
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(ProductCategory)
    category: ProductCategory;

    @IsNumber()
    @Min(0.01)
    price: number;

    @IsString()
    @IsOptional()
    currency?: string = 'XAF';

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    stock_quantity: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[] = [];

    @IsString()
    @IsOptional()
    video_url?: string;

    @IsString()
    @IsOptional()
    city?: string;
}

export class UpdateProductDto {
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(ProductCategory)
    @IsOptional()
    category?: ProductCategory;

    @IsNumber()
    @Min(0.01)
    @IsOptional()
    price?: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    stock_quantity?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsString()
    @IsOptional()
    video_url?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;
}

export class ProductFilterDto {
    @IsEnum(ProductCategory)
    @IsOptional()
    category?: ProductCategory;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    min_price?: number;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    max_price?: number;

    @IsString()
    @IsOptional()
    city?: string;

    @IsUUID()
    @IsOptional()
    seller_id?: string;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    page?: number = 1;

    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    @IsOptional()
    limit?: number = 20;

    @IsString()
    @IsOptional()
    search?: string;
}

export class ApproveProductDto {
    @IsBoolean()
    is_approved: boolean;
}

// =============================================
// Order DTOs
// =============================================
export class CreateOrderDto {
    @IsUUID()
    product_id: string;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    quantity: number;

    @IsEnum(DeliveryMethod)
    delivery_method: DeliveryMethod;

    @IsString()
    @IsOptional()
    delivery_address?: string;

    @IsString()
    @IsOptional()
    delivery_phone?: string;

    @IsString()
    @IsOptional()
    delivery_notes?: string;

    @IsEnum(PaymentMethod)
    @IsOptional()
    payment_method?: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;
}

export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    @IsOptional()
    status?: OrderStatus;

    @IsEnum(PaymentStatus)
    @IsOptional()
    payment_status?: PaymentStatus;
}

// =============================================
// Comment DTOs
// =============================================
export class CreateCommentDto {
    @IsUUID()
    product_id: string;

    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    comment: string;
}

export class ReplyToCommentDto {
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    seller_reply: string;
}

// =============================================
// Review DTOs
// =============================================
export class CreateReviewDto {
    @IsUUID()
    product_id: string;

    @IsUUID()
    order_id: string;

    @IsNumber()
    @Min(1)
    @Max(5)
    @Type(() => Number)
    rating: number;

    @IsString()
    @IsOptional()
    @MaxLength(1000)
    review_text?: string;
}

export class ReplyToReviewDto {
    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    seller_reply: string;
}

// =============================================
// Message DTOs
// =============================================
export class SendMessageDto {
    @IsUUID()
    product_id: string;

    @IsUUID()
    receiver_id: string;

    @IsString()
    @MinLength(1)
    @MaxLength(1000)
    message: string;
}

export class MarkMessageReadDto {
    @IsUUID()
    message_id: string;
}
