import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * GET /reviews/therapist/:id
   * Récupère les avis d'un thérapeute
   */
  @Get('therapist/:id')
  async getTherapistReviews(@Param('id') therapistId: string) {
    return this.reviewsService.getTherapistReviews(therapistId);
  }

  /**
   * GET /reviews/salon/:id
   * Récupère les avis d'un salon
   */
  @Get('salon/:id')
  async getSalonReviews(@Param('id') salonId: string) {
    return this.reviewsService.getSalonReviews(salonId);
  }

  /**
   * POST /reviews
   * Créer un nouvel avis
   */
  @Post()
  async createReview(
    @Body()
    createReviewDto: {
      user_id: string;
      therapist_id?: string;
      salon_id?: string;
      rating: number;
      comment?: string;
      cleanliness?: number;
      professionalism?: number;
      value?: number;
    },
  ) {
    return this.reviewsService.createReview(createReviewDto);
  }
}
