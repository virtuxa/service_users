// Express
import { Request, Response, NextFunction } from 'express';

// Utils
import AuthUtils from "../../services/auth/utils/auth.utils";

// Services
import UsersService from "../../services/users/users.service";

// Types
import { UserRole } from "../../services/users/types/users.interfaces";

// Logger
import Logger from "../../logger/logger";

class MiddlewareRest {
    private readonly logger = new Logger(MiddlewareRest.name);
    private static instance: MiddlewareRest;

    private constructor() {}

    public static getInstance(): MiddlewareRest {
        if (!MiddlewareRest.instance) {
            MiddlewareRest.instance = new MiddlewareRest();
        }
        return MiddlewareRest.instance;
    }

    // Общий middleware для проверки авторизации
    public auth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Проверяем токен
            const decoded = await this.validateToken(req);
            if (!decoded) {
                throw new Error('Invalid token');
            }

            // Проверяем, что пользователь активен
            const isActive = await UsersService.isUserActive(decoded.user.id);
            if (!isActive) {
                throw new Error('User account is blocked');
            }

            req.user = {
                id: decoded.user.id,
                role: decoded.user.role as UserRole
            };

            next();
        } catch (error: any) {
            this.logger.error(`Failed to authenticate user: ${error.message}`);
            
            let statusCode = 401;
            if (error.message === 'User account is blocked') {
                statusCode = 403;
            }

            res.status(statusCode).json({ 
                success: false,
                message: error.message || 'Authentication failed'
            });
        }
    }

    // Middleware для проверки роли админа
    public requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            if (req.user.role !== UserRole.ADMIN) {
                throw new Error('Admin role required');
            }

            next();
        } catch (error: any) {
            this.logger.error(`Admin access denied: ${error.message}`);
            
            res.status(403).json({ 
                success: false,
                message: error.message || 'Admin access required'
            });
        }
    }

    // Middleware для проверки, что пользователь может изменять данные (админ или сам пользователь)
    public requireOwnershipOrAdmin = (userIdParam: string = 'id') => {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (!req.user) {
                    throw new Error('User not authenticated');
                }

                const targetUserId = req.params[userIdParam];
                
                if (req.user.role === UserRole.ADMIN || req.user.id === targetUserId) {
                    next();
                } else {
                    throw new Error('Access denied');
                }
            } catch (error: any) {
                this.logger.error(`Ownership/Admin access denied: ${error.message}`);
                
                res.status(403).json({ 
                    success: false,
                    message: error.message || 'Access denied'
                });
            }
        };
    }

    // Валидация токена
    private validateToken = async (req: Request) => {
        try {
            // Получаем токен из заголовка Authorization
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new Error('Authorization header is required');
            }

            const token = authHeader.split(' ')[1];
            if (!token) {
                throw new Error('Token is required');
            }

            // Декодируем токен
            const decoded = await AuthUtils.verifyTokenAccess(token);

            return decoded;
        } catch (error: any) {
            this.logger.error(`Failed to validate token: ${error.message}`);
            throw new Error('Invalid or expired token');
        }
    }
}

export default MiddlewareRest.getInstance();