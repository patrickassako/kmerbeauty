import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CreditsModule } from '../credits/credits.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [CreditsModule, SupabaseModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService],
})
export class PaymentsModule { }
