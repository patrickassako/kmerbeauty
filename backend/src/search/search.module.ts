import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { ServicesModule } from '../services/services.module';

@Module({
    imports: [ServicesModule],
    controllers: [SearchController],
})
export class SearchModule { }
