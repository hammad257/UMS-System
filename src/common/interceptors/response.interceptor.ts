import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

interface ResponseBody<T> {
  message?: string;
  data?: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();

    return next.handle().pipe(
      map((body: T | ResponseBody<T>) => {
        const normalized = body ?? {};

        return {
          success: true,
          statusCode: response.statusCode,
          message: normalized.message ?? 'Request successful',
          data: normalized.data !== undefined ? normalized.data : (body as T),
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
