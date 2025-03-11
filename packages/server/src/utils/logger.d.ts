import { NextFunction, Request, Response } from 'express';
declare const logger: import("node_modules/winston").Logger;
export declare function expressRequestLogger(req: Request, res: Response, next: NextFunction): void;
export default logger;
