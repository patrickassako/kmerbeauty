import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class IsSellerGuard implements CanActivate {
    private supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;

        if (!userId) {
            throw new ForbiddenException('User not authenticated');
        }

        // Check if user is a contractor/therapist
        const { data } = await this.supabase
            .from('therapists')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!data) {
            throw new ForbiddenException('Only contractors can perform this action');
        }

        // Attach therapist ID to request for later use
        request.therapistId = data.id;
        return true;
    }
}

@Injectable()
export class IsProductOwnerGuard implements CanActivate {
    private supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const productId = request.params.id;

        if (!userId || !productId) {
            throw new ForbiddenException('Invalid request');
        }

        // Get therapist ID
        const { data: therapist } = await this.supabase
            .from('therapists')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (!therapist) {
            throw new ForbiddenException('User is not a contractor');
        }

        // Check product ownership
        const { data: product } = await this.supabase
            .from('marketplace_products')
            .select('seller_id')
            .eq('id', productId)
            .single();

        if (!product || product.seller_id !== therapist.id) {
            throw new ForbiddenException('You do not own this product');
        }

        request.therapistId = therapist.id;
        return true;
    }
}

@Injectable()
export class HasPurchasedGuard implements CanActivate {
    private supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        const body = request.body;

        if (!userId || !body.product_id || !body.order_id) {
            throw new ForbiddenException('Invalid request');
        }

        // Verify purchase
        const { data: order } = await this.supabase
            .from('marketplace_orders')
            .select('*')
            .eq('id', body.order_id)
            .eq('buyer_id', userId)
            .eq('product_id', body.product_id)
            .single();

        if (!order) {
            throw new ForbiddenException('You must purchase this product before reviewing');
        }

        return true;
    }
}
