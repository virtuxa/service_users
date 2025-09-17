import { UserRole } from '../services/users/types/users.interfaces';

export interface IResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface IErrorResponse {
    status: number;
    message: string;
    error?: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role?: UserRole;
            };
        }
    }
}