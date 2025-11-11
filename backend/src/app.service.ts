import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Bienvenue sur KmerServices API',
      description: 'Services de beauté à la demande - Cameroun',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        docs: '/api/v1/docs',
      },
    };
  }
}
