import { Module } from '@nestjs/common';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [PacksController],
    providers: [PacksService],
    exports: [PacksService],
})
export class PacksModule { }
