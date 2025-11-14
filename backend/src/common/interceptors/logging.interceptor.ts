import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const now = Date.now();

    this.logger.log(`📨 ${method} ${url}`);

    if (Object.keys(params || {}).length > 0) {
      this.logger.log(`   Params: ${JSON.stringify(params)}`);
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.log(`   Query: ${JSON.stringify(query)}`);
    }

    if (body && Object.keys(body).length > 0) {
      // Don't log sensitive data like passwords
      const sanitizedBody = { ...body };
      if (sanitizedBody.password) sanitizedBody.password = '***';
      this.logger.log(`   Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
    }

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        this.logger.log(`✅ ${method} ${url} - ${responseTime}ms`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - now;
        this.logger.error(`❌ ${method} ${url} - ${responseTime}ms`);
        this.logger.error(`   Error: ${error.message}`);
        if (error.response) {
          this.logger.error(`   Response: ${JSON.stringify(error.response, null, 2)}`);
        }
        throw error;
      }),
    );
  }
}
