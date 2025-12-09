import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    CreateProductDto,
    UpdateProductDto,
    ProductFilterDto,
    CreateOrderDto,
    UpdateOrderStatusDto,
    CreateCommentDto,
    CreateReviewDto,
    ReplyToCommentDto,
    ReplyToReviewDto,
    SendMessageDto,
    OrderStatus,
    PaymentStatus,
} from './dto/marketplace.dto';

@Injectable()
export class MarketplaceService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
    }

    // =============================================
    // Product Management
    // =============================================

    async createProduct(sellerId: string, dto: CreateProductDto) {
        // Deduct publication credit (0.1 credit)
        await this.deductPublicationCredit(sellerId);

        const { data, error } = await this.supabase
            .from('marketplace_products')
            .insert({
                seller_id: sellerId,
                ...dto,
                images: dto.images || [],
                is_approved: false, // Requires admin approval
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async updateProduct(productId: string, sellerId: string, dto: UpdateProductDto) {
        // Verify ownership
        const product = await this.getProductById(productId);
        if (product.seller_id !== sellerId) {
            throw new ForbiddenException('You can only update your own products');
        }

        const { data, error } = await this.supabase
            .from('marketplace_products')
            .update(dto)
            .eq('id', productId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async deleteProduct(productId: string, sellerId: string) {
        // Verify ownership
        const product = await this.getProductById(productId);
        if (product.seller_id !== sellerId) {
            throw new ForbiddenException('You can only delete your own products');
        }

        const { error } = await this.supabase
            .from('marketplace_products')
            .delete()
            .eq('id', productId);

        if (error) throw new BadRequestException(error.message);
        return { message: 'Product deleted successfully' };
    }

    async getProducts(filters: ProductFilterDto) {
        let query = this.supabase
            .from('marketplace_products')
            .select('*, therapists!inner(id, business_name, user_id, users!inner(first_name, last_name))', { count: 'exact' })
            .eq('is_approved', true)
            .eq('is_active', true);

        // Apply filters
        if (filters.category) {
            query = query.eq('category', filters.category);
        }
        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
        }
        if (filters.seller_id) {
            query = query.eq('seller_id', filters.seller_id);
        }
        if (filters.min_price) {
            query = query.gte('price', filters.min_price);
        }
        if (filters.max_price) {
            query = query.lte('price', filters.max_price);
        }
        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to).order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) throw new BadRequestException(error.message);

        return {
            data,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        };
    }

    async getProductById(id: string) {
        const { data, error } = await this.supabase
            .from('marketplace_products')
            .select('*, therapists!inner(id, business_name, user_id, users!inner(first_name, last_name, phone))')
            .eq('id', id)
            .single();

        if (error || !data) throw new NotFoundException('Product not found');

        // Increment views
        await this.incrementViews(id);

        return data;
    }

    async getMyProducts(sellerId: string) {
        const { data, error } = await this.supabase
            .from('marketplace_products')
            .select('*')
            .eq('seller_id', sellerId)
            .order('created_at', { ascending: false });

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async approveProduct(productId: string, adminId: string) {
        const { data, error } = await this.supabase
            .from('marketplace_products')
            .update({
                is_approved: true,
                approved_by: adminId,
                approved_at: new Date().toISOString(),
            })
            .eq('id', productId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async incrementViews(productId: string) {
        const { data: product } = await this.supabase
            .from('marketplace_products')
            .select('views_count, seller_id')
            .eq('id', productId)
            .single();

        if (!product) return;

        const newViewsCount = (product.views_count || 0) + 1;

        // Update views
        await this.supabase
            .from('marketplace_products')
            .update({ views_count: newViewsCount })
            .eq('id', productId);

        // Deduct credit every 100 views
        if (newViewsCount % 100 === 0) {
            await this.deductViewsCredit(product.seller_id);
        }
    }

    // =============================================
    // Order Management
    // =============================================

    async createOrder(buyerId: string, dto: CreateOrderDto) {
        // Get product and check stock
        const { data: product, error: productError } = await this.supabase
            .from('marketplace_products')
            .select('*')
            .eq('id', dto.product_id)
            .single();

        if (productError || !product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stock_quantity < dto.quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        // Calculate total price
        const totalPrice = product.price * dto.quantity;

        // Create order
        const { data: order, error: orderError } = await this.supabase
            .from('marketplace_orders')
            .insert({
                product_id: dto.product_id,
                buyer_id: buyerId,
                seller_id: product.seller_id,
                quantity: dto.quantity,
                unit_price: product.price,
                total_price: totalPrice,
                delivery_method: dto.delivery_method,
                delivery_address: dto.delivery_address,
                delivery_phone: dto.delivery_phone,
                delivery_notes: dto.delivery_notes,
                payment_method: dto.payment_method,
            })
            .select()
            .single();

        if (orderError) throw new BadRequestException(orderError.message);

        // Decrement stock
        await this.supabase
            .from('marketplace_products')
            .update({
                stock_quantity: product.stock_quantity - dto.quantity,
                sales_count: (product.sales_count || 0) + 1,
            })
            .eq('id', dto.product_id);

        return order;
    }

    async getOrders(userId: string, role: 'buyer' | 'seller') {
        let query = this.supabase
            .from('marketplace_orders')
            .select('*, marketplace_products(name, images), users!marketplace_orders_buyer_id_fkey(first_name, last_name, phone)');

        if (role === 'buyer') {
            query = query.eq('buyer_id', userId);
        } else {
            // Get seller's therapist ID
            const { data: therapist } = await this.supabase
                .from('therapists')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (therapist) {
                query = query.eq('seller_id', therapist.id);
            }
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getOrderById(id: string) {
        const { data, error } = await this.supabase
            .from('marketplace_orders')
            .select('*, marketplace_products(*), users!marketplace_orders_buyer_id_fkey(*)')
            .eq('id', id)
            .single();

        if (error || !data) throw new NotFoundException('Order not found');
        return data;
    }

    async updateOrderStatus(orderId: string, sellerId: string, dto: UpdateOrderStatusDto) {
        // Verify seller owns this order
        const order = await this.getOrderById(orderId);
        if (order.seller_id !== sellerId) {
            throw new ForbiddenException('You can only update your own orders');
        }

        const updateData: any = {};
        if (dto.status) updateData.status = dto.status;
        if (dto.payment_status) {
            updateData.payment_status = dto.payment_status;
            if (dto.payment_status === PaymentStatus.PAID) {
                updateData.paid_at = new Date().toISOString();
            }
        }

        const { data, error } = await this.supabase
            .from('marketplace_orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // =============================================
    // Comments
    // =============================================

    async createComment(userId: string, dto: CreateCommentDto) {
        const { data, error } = await this.supabase
            .from('marketplace_comments')
            .insert({
                product_id: dto.product_id,
                user_id: userId,
                comment: dto.comment,
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);

        // Deduct credit from seller
        const { data: product } = await this.supabase
            .from('marketplace_products')
            .select('seller_id')
            .eq('id', dto.product_id)
            .single();

        if (product) {
            await this.deductCommentCredit(product.seller_id);
        }

        return data;
    }

    async getComments(productId: string) {
        const { data, error } = await this.supabase
            .from('marketplace_comments')
            .select('*, users(first_name, last_name)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async replyToComment(sellerId: string, commentId: string, dto: ReplyToCommentDto) {
        // Verify seller owns the product
        const { data: comment } = await this.supabase
            .from('marketplace_comments')
            .select('product_id, marketplace_products!inner(seller_id)')
            .eq('id', commentId)
            .single();

        if (!comment || (comment.marketplace_products as any).seller_id !== sellerId) {
            throw new ForbiddenException('You can only reply to comments on your products');
        }

        const { data, error } = await this.supabase
            .from('marketplace_comments')
            .update({
                seller_reply: dto.seller_reply,
                seller_reply_at: new Date().toISOString(),
            })
            .eq('id', commentId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // =============================================
    // Reviews
    // =============================================

    async createReview(userId: string, dto: CreateReviewDto) {
        // Verify user purchased this product
        const { data: order } = await this.supabase
            .from('marketplace_orders')
            .select('*')
            .eq('id', dto.order_id)
            .eq('buyer_id', userId)
            .eq('product_id', dto.product_id)
            .single();

        if (!order) {
            throw new ForbiddenException('You can only review products you have purchased');
        }

        const { data, error } = await this.supabase
            .from('marketplace_reviews')
            .insert({
                product_id: dto.product_id,
                user_id: userId,
                order_id: dto.order_id,
                rating: dto.rating,
                review_text: dto.review_text,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                throw new BadRequestException('You have already reviewed this purchase');
            }
            throw new BadRequestException(error.message);
        }

        // Deduct credit from seller
        const { data: product } = await this.supabase
            .from('marketplace_products')
            .select('seller_id')
            .eq('id', dto.product_id)
            .single();

        if (product) {
            await this.deductReviewCredit(product.seller_id);
        }

        return data;
    }

    async getReviews(productId: string) {
        const { data, error } = await this.supabase
            .from('marketplace_reviews')
            .select('*, users(first_name, last_name), marketplace_orders(id)')
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async replyToReview(sellerId: string, reviewId: string, dto: ReplyToReviewDto) {
        // Verify seller owns the product
        const { data: review } = await this.supabase
            .from('marketplace_reviews')
            .select('product_id, marketplace_products!inner(seller_id)')
            .eq('id', reviewId)
            .single();

        if (!review || (review.marketplace_products as any).seller_id !== sellerId) {
            throw new ForbiddenException('You can only reply to reviews on your products');
        }

        const { data, error } = await this.supabase
            .from('marketplace_reviews')
            .update({
                seller_reply: dto.seller_reply,
                seller_reply_at: new Date().toISOString(),
            })
            .eq('id', reviewId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // =============================================
    // Messages
    // =============================================

    async sendMessage(senderId: string, dto: SendMessageDto) {
        const { data, error } = await this.supabase
            .from('marketplace_messages')
            .insert({
                product_id: dto.product_id,
                sender_id: senderId,
                receiver_id: dto.receiver_id,
                message: dto.message,
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);

        // Deduct credit from seller (receiver)
        const { data: therapist } = await this.supabase
            .from('therapists')
            .select('id')
            .eq('user_id', dto.receiver_id)
            .single();

        if (therapist) {
            // Count messages for this seller
            const { count } = await this.supabase
                .from('marketplace_messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', dto.receiver_id);

            // Deduct every 10 messages
            if (count && count % 10 === 0) {
                await this.deductMessageCredit(therapist.id);
            }
        }

        return data;
    }

    async getConversations(userId: string, productId?: string) {
        let query = this.supabase
            .from('marketplace_messages')
            .select('*, marketplace_products(name, images), users!marketplace_messages_sender_id_fkey(first_name, last_name)')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (productId) {
            query = query.eq('product_id', productId);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async markAsRead(messageId: string, userId: string) {
        const { data, error } = await this.supabase
            .from('marketplace_messages')
            .update({ is_read: true })
            .eq('id', messageId)
            .eq('receiver_id', userId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // =============================================
    // Credit Deductions
    // =============================================

    private async deductPublicationCredit(sellerId: string) {
        await this.deductCredit(sellerId, 0.1, 'marketplace_publication');
    }

    private async deductViewsCredit(sellerId: string) {
        await this.deductCredit(sellerId, 1, 'marketplace_views');
    }

    private async deductMessageCredit(sellerId: string) {
        await this.deductCredit(sellerId, 1, 'marketplace_messages');
    }

    private async deductCommentCredit(sellerId: string) {
        await this.deductCredit(sellerId, 0.5, 'marketplace_comment');
    }

    private async deductReviewCredit(sellerId: string) {
        await this.deductCredit(sellerId, 0.5, 'marketplace_review');
    }

    private async deductCredit(sellerId: string, amount: number, reason: string) {
        // Get current balance
        const { data: balance } = await this.supabase
            .from('provider_credits')
            .select('balance')
            .eq('provider_id', sellerId)
            .eq('provider_type', 'therapist')
            .single();

        if (!balance || balance.balance < amount) {
            console.warn(`Insufficient credits for ${sellerId}.Required: ${amount}, Available: ${balance?.balance || 0} `);
            return; // Don't block action, just log warning
        }

        // Deduct credit
        await this.supabase
            .from('provider_credits')
            .update({
                balance: balance.balance - amount,
                updated_at: new Date().toISOString(),
            })
            .eq('provider_id', sellerId)
            .eq('provider_type', 'therapist');

        // Record transaction
        await this.supabase
            .from('credit_transactions')
            .insert({
                provider_id: sellerId,
                provider_type: 'therapist',
                amount: -amount,
                transaction_type: 'debit',
                reason,
            });
    }

    // =============================================
    // File Upload
    // =============================================

    async uploadFile(file: any, userId: string, fileType: string) {
        // Generate a unique filename
        const timestamp = Date.now();
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}/${fileType}_${timestamp}.${fileExt}`;

        // Use marketplace-files bucket
        const bucket = 'marketplace-files';

        // Upload to Supabase Storage
        const { data, error } = await this.supabase.storage
            .from(bucket)
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (error) throw new Error(`Upload failed: ${error.message}`);

        // Get public URL
        const {
            data: { publicUrl },
        } = this.supabase.storage.from(bucket).getPublicUrl(fileName);

        return {
            url: publicUrl,
            fileName: fileName,
            fileType: fileType,
        };
    }
}
