import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [SupabaseModule, ReportsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule { }
