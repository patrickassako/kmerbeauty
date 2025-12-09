import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
