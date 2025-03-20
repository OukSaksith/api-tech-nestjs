// import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';

// @Injectable()
// export class LoggerMiddleware implements NestMiddleware {
//   private readonly logger = new Logger('HTTP'); // Name it "HTTP" for global logs

//   use(req: Request, res: Response, next: NextFunction) {
//     this.logger.log(`[${req.method}] ${req.url}`);
//     next();
//   }
// }
