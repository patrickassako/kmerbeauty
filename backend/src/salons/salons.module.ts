import { Module } from '@nestjs/common';
import { SalonsController } from './salons.controller';
import { SalonsService } from './salons.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
