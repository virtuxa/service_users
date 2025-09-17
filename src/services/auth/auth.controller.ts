// Express
import { Request, Response, Router } from 'express';

// Services
import AuthService from '../../services/auth/auth.service';

// Types
import { IResponse } from '../../types/rest';
import { ILoginRequest, IRegisterRequest } from '../users/types/users.interfaces';

// Logger
import Logger from '../../logger/logger';

class AuthController {
    private readonly logger = new Logger(AuthController.name);
    private static instance: AuthController;

    private constructor() {}

    public static getInstance(): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController();
        }
        return AuthController.instance;
    }

    public getRouter(): Router {
        const router = Router();

        // Роуты без аутентификации
        router.post('/register', this.register);
        router.post('/login', this.login);
        router.post('/refresh', this.refreshToken);

        return router;
    }

    // Регистрация пользователя
    private register = async (req: Request, res: Response) => {
        try {
            const registerData: IRegisterRequest = req.body;

            // Преобразуем строку даты в Date объект
            if (registerData.birth_date) {
                registerData.birth_date = new Date(registerData.birth_date);
            }

            const result = await AuthService.register(registerData);

            const response: IResponse = {
                success: true,
                message: 'User registered successfully',
                data: result
            };

            this.logger.info(`User registration successful: ${registerData.email}`);
            res.status(201).json(response);

        } catch (error: any) {
            this.logger.error(`User registration failed: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Registration failed'
            };

            // Определяем статус ошибки
            let statusCode = 400;
            if (error.message === 'Email already exists') {
                statusCode = 409; // Conflict
            }

            res.status(statusCode).json(errorResponse);
        }
    }

    // Авторизация пользователя
    private login = async (req: Request, res: Response) => {
        try {
            const loginData: ILoginRequest = req.body;

            const result = await AuthService.login(loginData);

            const response: IResponse = {
                success: true,
                message: 'Login successful',
                data: result
            };

            this.logger.info(`User login successful: ${loginData.email}`);
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`User login failed: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Login failed'
            };

            // Определяем статус ошибки
            let statusCode = 400;
            if (error.message === 'Invalid credentials') {
                statusCode = 401; // Unauthorized
            } else if (error.message === 'User account is blocked') {
                statusCode = 403; // Forbidden
            }

            res.status(statusCode).json(errorResponse);
        }
    }

    // Обновление токена
    private refreshToken = async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                throw new Error('Refresh token is required');
            }

            const result = await AuthService.refreshToken(refreshToken);

            const response: IResponse = {
                success: true,
                message: 'Token refreshed successfully',
                data: result
            };

            this.logger.info('Token refresh successful');
            res.status(200).json(response);

        } catch (error: any) {
            this.logger.error(`Token refresh failed: ${error.message}`);
            
            const errorResponse: IResponse = {
                success: false,
                message: error.message || 'Token refresh failed'
            };

            res.status(401).json(errorResponse);
        }
    }
}


export default AuthController.getInstance();