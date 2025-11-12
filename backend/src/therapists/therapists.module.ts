import { Module } from '@nestjs/common';
import { TherapistsController } from './therapists.controller';
import { TherapistsService } from './therapists.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TherapistsController],
  providers: [TherapistsService],
  exports: [TherapistsService],
})
export class TherapistsModule {}
