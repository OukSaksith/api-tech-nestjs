import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import * as winston from 'winston';
import 'winston-daily-rotate-file';  

const dailyRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',  // File name pattern (e.g., application-2025-03-19.log)
    datePattern: 'YYYY-MM-DD',  // Format for the date (year-month-day)
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    maxFiles: '14d',  // Keep logs for the last 14 days (you can adjust this value as needed)
  });

const fileTransport = new winston.transports.File({
    filename: '/var/log/app/application.log',
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  });


// ✅ Winston Logger Configuration for Console (stdout/stderr)
const consoleTransport = new winston.transports.Console({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),   // Adds timestamp to logs
    winston.format.json()         // Logs in JSON format
  ),
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [consoleTransport, fileTransport, dailyRotateTransport],  // Log to stdout
});

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, headers, ip, hostname } = request;
    const requestId = uuidv4();  // Generate a unique ID for tracking
    const now = Date.now();

    const logData = {
      requestId,
      timestamp: new Date().toISOString(),
      method,
      url,
      clientIp: ip,
      requestHost: hostname,
      headers,
      queryParams: query,
      pathParams: params,
      requestBody: body,
    };

    // Log request details to stdout (console)
    this.logger.log(`🆔 [${requestId}] ➡️ Incoming Request: ${method} ${url}`);
    logger.info({ message: 'Incoming Request', ...logData });

    return next.handle().pipe(
      map((responseBody) => {
        const executionTime = Date.now() - now;
        const response = context.switchToHttp().getResponse();

        const responseLogData = {
          ...logData,
          responseTimeMs: executionTime,
          responseStatus: response.statusCode,
          responseBody,
        };

        // Log response details to stdout (console)
        this.logger.log(`🆔 [${requestId}] ⬅️ Response: ${method} ${url} - ${executionTime}ms`);
        logger.info({ message: 'Response', ...responseLogData });

        return responseBody;
      }),
      catchError((err) => {
        // Catch exceptions and log them
        const executionTime = Date.now() - now;
        const response = context.switchToHttp().getResponse();

        const errorLogData = {
          ...logData,
          responseTimeMs: executionTime,
          responseStatus: err instanceof HttpException ? err.getStatus() : 500,
          errorMessage: err.message,
          stack: err.stack,
        };

        // Log exception details to stdout (console)
        this.logger.error(`🆔 [${requestId}] ⬅️ Error Response: ${method} ${url} - ${executionTime}ms`);
        logger.error({ message: 'Exception', ...errorLogData });

        return throwError(err); // Rethrow the error after logging
      })
    );
  }
}
