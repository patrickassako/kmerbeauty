import { Module } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { InteractionTrackingService } from './interaction-tracking.service';
import { MonthlyCreditsService } from './monthly-credits.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [CreditsController],
    providers: [CreditsService, InteractionTrackingService, MonthlyCreditsService],
    exports: [CreditsService, InteractionTrackingService],
})
export class CreditsModule { }
