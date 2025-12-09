import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MarketplaceService } from './marketplace.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { IsSellerGuard, IsProductOwnerGuard, HasPurchasedGuard } from './guards/marketplace.guard';
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
    ApproveProductDto,
} from './dto/marketplace.dto';

@Controller('marketplace')
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) { }

    // =============================================
    // Product Endpoints
    // =============================================

    @Get('products')
    async getProducts(@Query() filters: ProductFilterDto) {
        return this.marketplaceService.getProducts(filters);
    }

    @Get('products/:id')
    async getProductById(@Param('id') id: string) {
        return this.marketplaceService.getProductById(id);
    }

    @Post('products')
    @UseGuards(AuthGuard, IsSellerGuard)
    async createProduct(@Request() req, @Body() dto: CreateProductDto) {
        return this.marketplaceService.createProduct(req.therapistId, dto);
    }

    @Patch('products/:id')
    @UseGuards(AuthGuard, IsProductOwnerGuard)
    async updateProduct(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: UpdateProductDto,
    ) {
        return this.marketplaceService.updateProduct(id, req.therapistId, dto);
    }

    @Delete('products/:id')
    @UseGuards(AuthGuard, IsProductOwnerGuard)
    async deleteProduct(@Param('id') id: string, @Request() req) {
        return this.marketplaceService.deleteProduct(id, req.therapistId);
    }

    @Get('my-products')
    @UseGuards(AuthGuard, IsSellerGuard)
    async getMyProducts(@Request() req) {
        return this.marketplaceService.getMyProducts(req.therapistId);
    }

    @Patch('products/:id/approve')
    @UseGuards(AuthGuard) // TODO: Add IsAdminGuard
    async approveProduct(@Param('id') id: string, @Request() req, @Body() dto: ApproveProductDto) {
        return this.marketplaceService.approveProduct(id, req.user.id);
    }

    // =============================================
    // Order Endpoints
    // =============================================

    @Post('orders')
    @UseGuards(AuthGuard)
    async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
        return this.marketplaceService.createOrder(req.user.id, dto);
    }

    @Get('orders')
    @UseGuards(AuthGuard)
    async getOrders(@Request() req, @Query('role') role: 'buyer' | 'seller' = 'buyer') {
        return this.marketplaceService.getOrders(req.user.id, role);
    }

    @Get('orders/:id')
    @UseGuards(AuthGuard)
    async getOrderById(@Param('id') id: string) {
        return this.marketplaceService.getOrderById(id);
    }

    @Patch('orders/:id/status')
    @UseGuards(AuthGuard, IsSellerGuard)
    async updateOrderStatus(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.marketplaceService.updateOrderStatus(id, req.therapistId, dto);
    }

    // =============================================
    // Comment Endpoints
    // =============================================

    @Get('products/:id/comments')
    async getComments(@Param('id') productId: string) {
        return this.marketplaceService.getComments(productId);
    }

    @Post('products/:id/comments')
    @UseGuards(AuthGuard)
    async createComment(@Request() req, @Param('id') productId: string, @Body() dto: Omit<CreateCommentDto, 'product_id'>) {
        return this.marketplaceService.createComment(req.user.id, { ...dto, product_id: productId });
    }

    @Patch('comments/:id/reply')
    @UseGuards(AuthGuard, IsSellerGuard)
    async replyToComment(
        @Param('id') commentId: string,
        @Request() req,
        @Body() dto: ReplyToCommentDto,
    ) {
        return this.marketplaceService.replyToComment(req.therapistId, commentId, dto);
    }

    // =============================================
    // Review Endpoints
    // =============================================

    @Get('products/:id/reviews')
    async getReviews(@Param('id') productId: string) {
        return this.marketplaceService.getReviews(productId);
    }

    @Post('products/:id/reviews')
    @UseGuards(AuthGuard, HasPurchasedGuard)
    async createReview(@Request() req, @Param('id') productId: string, @Body() dto: Omit<CreateReviewDto, 'product_id'>) {
        return this.marketplaceService.createReview(req.user.id, { ...dto, product_id: productId });
    }

    @Patch('reviews/:id/reply')
    @UseGuards(AuthGuard, IsSellerGuard)
    async replyToReview(
        @Param('id') reviewId: string,
        @Request() req,
        @Body() dto: ReplyToReviewDto,
    ) {
        return this.marketplaceService.replyToReview(req.therapistId, reviewId, dto);
    }

    // =============================================
    // Message Endpoints
    // =============================================

    @Get('messages')
    @UseGuards(AuthGuard)
    async getConversations(@Request() req, @Query('product_id') productId?: string) {
        return this.marketplaceService.getConversations(req.user.id, productId);
    }

    @Post('messages')
    @UseGuards(AuthGuard)
    async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
        return this.marketplaceService.sendMessage(req.user.id, dto);
    }

    @Patch('messages/:id/read')
    @UseGuards(AuthGuard)
    async markAsRead(@Param('id') messageId: string, @Request() req) {
        return this.marketplaceService.markAsRead(messageId, req.user.id);
    }

    // =============================================
    // File Upload
    // =============================================

    @Post('upload')
    @UseGuards(AuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(
        @UploadedFile() file: any,
        @Body('userId') userId: string,
        @Body('fileType') fileType: string,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (!userId) {
            throw new BadRequestException('User ID is required');
        }

        if (!fileType) {
            throw new BadRequestException('File type is required');
        }

        return this.marketplaceService.uploadFile(file, userId, fileType);
    }
}
