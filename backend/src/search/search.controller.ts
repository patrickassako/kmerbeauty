import { Controller, Get, Query } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { SearchServicesDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly servicesService: ServicesService) { }

    @Get()
    async search(@Query() query: SearchServicesDto) {
        return this.servicesService.findAll(query.category);
    }
}
