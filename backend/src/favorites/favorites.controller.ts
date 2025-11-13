import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  /**
   * GET /favorites/check/therapist/:therapistId?userId=xxx
   * Vérifier si un thérapeute est en favoris
   */
  @Get('check/therapist/:therapistId')
  async checkTherapistFavorite(
    @Param('therapistId') therapistId: string,
    @Query('userId') userId: string,
  ) {
    const isFavorite = await this.favoritesService.isTherapistFavorite(userId, therapistId);
    return { isFavorite };
  }

  /**
   * GET /favorites/check/salon/:salonId?userId=xxx
   * Vérifier si un salon est en favoris
   */
  @Get('check/salon/:salonId')
  async checkSalonFavorite(
    @Param('salonId') salonId: string,
    @Query('userId') userId: string,
  ) {
    const isFavorite = await this.favoritesService.isSalonFavorite(userId, salonId);
    return { isFavorite };
  }

  /**
   * POST /favorites/therapist
   * Ajouter un thérapeute aux favoris
   */
  @Post('therapist')
  async addTherapistToFavorites(
    @Body() body: { userId: string; therapistId: string },
  ) {
    return this.favoritesService.addTherapistToFavorites(body.userId, body.therapistId);
  }

  /**
   * POST /favorites/salon
   * Ajouter un salon aux favoris
   */
  @Post('salon')
  async addSalonToFavorites(
    @Body() body: { userId: string; salonId: string },
  ) {
    return this.favoritesService.addSalonToFavorites(body.userId, body.salonId);
  }

  /**
   * DELETE /favorites/therapist/:therapistId?userId=xxx
   * Retirer un thérapeute des favoris
   */
  @Delete('therapist/:therapistId')
  async removeTherapistFromFavorites(
    @Param('therapistId') therapistId: string,
    @Query('userId') userId: string,
  ) {
    return this.favoritesService.removeTherapistFromFavorites(userId, therapistId);
  }

  /**
   * DELETE /favorites/salon/:salonId?userId=xxx
   * Retirer un salon des favoris
   */
  @Delete('salon/:salonId')
  async removeSalonFromFavorites(
    @Param('salonId') salonId: string,
    @Query('userId') userId: string,
  ) {
    return this.favoritesService.removeSalonFromFavorites(userId, salonId);
  }

  /**
   * GET /favorites/user/:userId
   * Récupérer tous les favoris d'un utilisateur
   */
  @Get('user/:userId')
  async getUserFavorites(@Param('userId') userId: string) {
    return this.favoritesService.getUserFavorites(userId);
  }
}
