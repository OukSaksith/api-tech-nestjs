import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
  HttpException,
  LoggerService,
} from '@nestjs/common';
import * as moment from 'moment-timezone';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

const timestampFormat = () =>
  moment().tz('Asia/Phnom_Penh').format('YYYY-MM-DD HH:mm:ss');

// ✅ Readable text format for Console & File
const readableFormat = winston.format.printf(
  ({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  },
);

// ✅ Winston Daily Rotate File (Readable) with the same format as Console
const dailyRotateReadable = new winston.transports.DailyRotateFile({
  filename: '/var/log/app/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestampFormat }),
    readableFormat // Use the same readable format for logs
  ),
  maxFiles: '14d',
});

// ✅ Console Transport (Readable logs)
const consoleTransport = new winston.transports.Console({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: timestampFormat }),
    winston.format.colorize(),
    readableFormat // Use the same readable format for console logs
  ),
});

// Create the logger with readable format for all transports
export const logger = winston.createLogger({
  level: 'info',
  transports: [consoleTransport, dailyRotateReadable],
});


@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query, headers, ip, hostname } = request;
    const requestId = uuidv4(); // Generate a unique ID for tracking
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
    logger.info(`[${LoggingInterceptor.name}] - 🆔 [${requestId}] ➡️ Incoming Request: ${method} ${url}`);
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
        this.logger.log(
          `🆔 [${requestId}] ⬅️ Response: ${method} ${url} - ${executionTime}ms`,
        );
        logger.info(`[${LoggingInterceptor.name}] - 🆔 [${requestId}] ⬅️ Response: ${method} ${url} - ${executionTime}ms`);
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
        this.logger.error(
          `🆔 [${requestId}] ⬅️ Error Response: ${method} ${url} - ${executionTime}ms`,
        );
        logger.error(`[${LoggingInterceptor.name}] - 🆔 [${requestId}] ⬅️ Error Response: ${method} ${url} - ${executionTime}ms`);
        logger.error({ message: 'Exception', ...errorLogData });

        return throwError(err); // Rethrow the error after logging
      }),
    );
  }

  //USE FOR INDIVIDUAL
  log(message: string, clazz: string, data : object) {
    const requestId = uuidv4();
    const formattedData = JSON.stringify(data, null, 2) || [];
    this.logger.log(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ➡️ Log Response: ${message}  ➡️  data : ${formattedData}`);
    logger.info(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ⬅️ Log Response: ${message}  ➡️  data : ${formattedData}`);
  }

  error(message: string, trace: string, clazz: string) {
    const requestId = uuidv4(); 
    this.logger.error(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ➡️ Error Response: ${message} ⬅️ Error Trace: ${trace}`);
    logger.error(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ⬅️ Error Response: ${message} ⬅️ Error Trace: ${trace}`);
  }

  warn(message: string, clazz: string) {
    const requestId = uuidv4(); 
    this.logger.warn(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ➡️ Warn Response: ${message}`);
    logger.warn(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ⬅️ Warn Response: ${message}`);
  }

  debug(message: string, clazz: string) {
    const requestId = uuidv4(); 
    this.logger.warn(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ➡️ Debug Response: ${message}`);
    logger.debug(`[${clazz === null ? LoggingInterceptor.name : clazz}] - 🆔 [${requestId}] ⬅️ Debug Response: ${message}`);
  }

}
