// Express
import { Router } from 'express';

// Controllers
import UsersController from '../services/users/users.controller';
import AuthController from '../services/auth/auth.controller';

// Logger
import Logger from '../logger/logger';

class AppRouter {
    private readonly logger = new Logger(AppRouter.name);
    private router: Router;

    constructor() {
        this.router = Router();
        this.initializeRoutes();
        this.logger.info('Router initialized successfully');
    }

    public getRouter(): Router {
        return this.router;
    }

    private initializeRoutes(): void {

        this.router.use('/api', this.router);

        // Логгирование всех маршрутов
        this.router.use((req, res, next) => {
            this.logger.net(`Route called: ${req.method} ${req.originalUrl}`);
            next();
        });

        // health check
        this.router.get('/health', (req, res) => {
            this.logger.info('Health check requested');
            res.status(200).json({
                status: 'OK',
                message: 'API is working',
                timestamp: new Date().toISOString()
            });
        });

        // Группировка маршрутов по API
        this.setupRoutes();
        
        // Обработка несуществующих маршрутов
        this.router.use('*', (req, res) => {
            this.logger.warning(`Route not found: ${req.method} ${req.originalUrl}`);
            res.status(404).json({
                error: 'Route not found',
                message: `The requested route ${req.method} ${req.originalUrl} does not exist`
            });
        });
    }

    // API
    private setupRoutes(): void {
        // Подключаем роуты к основному роутеру
        this.router.use('/auth', AuthController.getRouter());
        this.router.use('/users', UsersController.getRouter());

        this.logger.info('API routes initialized successfully');
    }
}

// Экспортируем экземпляр роутера
export default new AppRouter().getRouter();