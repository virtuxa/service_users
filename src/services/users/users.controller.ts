// Express
import { Request, Response, Router } from 'express';

// Middlewares
import MiddlewareRest from '../../routes/middlewares/middleware.rest';

// Services
import UsersService from '../../services/users/users.service';

// Types
import { IResponse } from '../../types/rest';
import { UserRole } from './types/users.interfaces';

// Logger
import Logger from '../../logger/logger';

class UsersController {
    private readonly logger = new Logger(UsersController.name);
    private static instance: UsersController;

    private constructor() {}

    public static getInstance(): UsersController {
        if (!UsersController.instance) {
            UsersController.instance = new UsersController();
        }
        return UsersController.instance;
    }

    public getRouter(): Router {
        const router = Router();

        // Подключаем middleware для проверки авторизации ко всем роутам
        router.use(MiddlewareRest.auth);

        // Роуты для работы с пользователями
        router.get('/me', this.getCurrentUser);
        router.get('/', this.getAllUsers);
        router.get('/:id', this.getUserById);
        router.patch('/:id/status', this.setUserActiveStatus);

        return router;
    }

    // Получение информации о текущем пользователе
    private getCurrentUser = async (req: Request, res: Response) => {
        try {
            if (!req.user?.id) {
                throw new Error('User ID not found in request');
            }

            const result = await UsersService.getCurrentUser(req.user.id);

            const response: IResponse = {
                success: true,
                message: 'Current user retrieved successfully',
                data: result
            };

            this.logger.info(`Current user info retrieved for: ${req.user.id}`);
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`Failed to get current user: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Failed to get current user'
            };

            res.status(404).json(errorResponse);
        }
    }

    // Получение пользователя по ID
    private getUserById = async (req: Request, res: Response) => {
        try {
            const { id: userId } = req.params;

            if (!req.user?.id || !req.user?.role) {
                throw new Error('User authentication data not found');
            }

            const result = await UsersService.getUserById(
                userId, 
                req.user.id, 
                req.user.role as UserRole
            );

            const response: IResponse = {
                success: true,
                message: 'User retrieved successfully',
                data: result
            };

            this.logger.info(`User ${userId} retrieved by ${req.user.id}`);
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`Failed to get user by ID: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Failed to get user'
            };

            // Определяем статус ошибки
            let statusCode = 400;
            if (error.message === 'Access denied') {
                statusCode = 403; // Forbidden
            } else if (error.message === 'User not found') {
                statusCode = 404; // Not Found
            }

            res.status(statusCode).json(errorResponse);
        }
    }

    // Получение списка всех пользователей (только для админа)
    private getAllUsers = async (req: Request, res: Response) => {
        try {
            if (!req.user?.id || !req.user?.role) {
                throw new Error('User authentication data not found');
            }

            const result = await UsersService.getAllUsers(
                req.user.id, 
                req.user.role as UserRole
            );

            const response: IResponse = {
                success: true,
                message: 'Users retrieved successfully',
                data: result
            };

            this.logger.info(`All users retrieved by admin: ${req.user.id}`);
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`Failed to get all users: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Failed to get users'
            };

            // Определяем статус ошибки
            let statusCode = 400;
            if (error.message === 'Access denied. Admin role required') {
                statusCode = 403; // Forbidden
            }

            res.status(statusCode).json(errorResponse);
        }
    }

    // Блокировка/разблокировка пользователя
    private setUserActiveStatus = async (req: Request, res: Response) => {
        try {
            const { id: userId } = req.params;
            const { isActive } = req.body;

            if (!req.user?.id || !req.user?.role) {
                throw new Error('User authentication data not found');
            }

            if (typeof isActive !== 'boolean') {
                throw new Error('isActive must be a boolean value');
            }

            const result = await UsersService.setUserActiveStatus(
                userId,
                isActive,
                req.user.id,
                req.user.role as UserRole
            );

            const action = isActive ? 'activated' : 'blocked';
            const response: IResponse = {
                success: true,
                message: `User ${action} successfully`,
                data: result
            };

            this.logger.info(`User ${userId} ${action} by ${req.user.id}`);
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`Failed to set user active status: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Failed to update user status'
            };

            // Определяем статус ошибки
            let statusCode = 400;
            if (error.message === 'Access denied') {
                statusCode = 403; // Forbidden
            } else if (error.message === 'User not found') {
                statusCode = 404; // Not Found
            } else if (error.message === 'Admin cannot block themselves') {
                statusCode = 409; // Conflict
            }

            res.status(statusCode).json(errorResponse);
        }
    }
}


export default UsersController.getInstance();