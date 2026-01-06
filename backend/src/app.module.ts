import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { ServicesModule } from './services/services.module';
import { TherapistsModule } from './therapists/therapists.module';
import { SalonsModule } from './salons/salons.module';
import { CategoriesModule } from './categories/categories.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ContractorModule } from './contractor/contractor.module';
import { ProposalModule } from './proposal/proposal.module';
import { CreditsModule } from './credits/credits.module';
import { PaymentsModule } from './payments/payments.module';

import { MarketplaceModule } from './marketplace/marketplace.module';
import { SearchModule } from './search/search.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 60, // 60 requests per minute per IP
    }]),
    SupabaseModule,
    AuthModule,
    ServicesModule,
    TherapistsModule,
    SalonsModule,
    CategoriesModule,
    BookingsModule,
    ChatModule,
    ReviewsModule,
    FavoritesModule,
    ContractorModule,
    ProposalModule,
    CreditsModule,
    PaymentsModule,
    MarketplaceModule,
    SearchModule,
    GeocodingModule,
    ReportsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
