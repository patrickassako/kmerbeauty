import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
    imports: [
        MulterModule.register({
            limits: {
                fileSize: 50 * 1024 * 1024, // 50MB
            },
        }),
    ],
    controllers: [MarketplaceController],
    providers: [MarketplaceService],
    exports: [MarketplaceService],
})
export class MarketplaceModule { }
