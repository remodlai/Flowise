import { Request, Response, NextFunction } from 'express';
export declare const supabase: any;
export declare const checkUserRole: (userId: string, role: string, entityId?: string) => Promise<boolean>;
export declare const isPlatformAdmin: (userId: string) => Promise<boolean>;
export declare const isOrgAdmin: (userId: string, orgId: string) => Promise<boolean>;
export declare const isAppOwner: (userId: string, appId: string) => Promise<boolean>;
export declare const requirePlatformAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrgAdmin: (orgId: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
