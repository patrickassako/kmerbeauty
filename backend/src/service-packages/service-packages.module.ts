import { Module } from '@nestjs/common';
import { ServicePackagesController } from './service-packages.controller';
import { ServicePackagesService } from './service-packages.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [SupabaseModule],
    controllers: [ServicePackagesController],
    providers: [ServicePackagesService],
    exports: [ServicePackagesService],
})
export class ServicePackagesModule { }
