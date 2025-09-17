import bcrypt from 'bcrypt';

// Repositories
import UsersRepository from "./repositories/users.repository";

// Types
import { IUser, IUserResponse, UserRole } from "./types/users.interfaces";

// Logger
import Logger from "../../logger/logger";

class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private static instance: UsersService;

    private constructor() {}

    public static getInstance(): UsersService {
        if (!UsersService.instance) {
            UsersService.instance = new UsersService();
        }
        return UsersService.instance;
    }

    // Получение пользователя по ID
    public async getUserById(userId: string, requesterId: string, requesterRole: UserRole): Promise<IUserResponse> {
        try {
            // Проверяем права доступа: админ может получить любого пользователя, обычный пользователь только себя
            if (requesterRole !== UserRole.ADMIN && userId !== requesterId) {
                throw new Error('Access denied');
            }

            const user = await UsersRepository.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            this.logger.info(`User retrieved by ID: ${userId} by requester: ${requesterId}`);
            return this.mapUserToResponse(user);

        } catch (error: any) {
            this.logger.error(`Failed to get user by ID ${userId}: ${error.message}`);
            throw error;
        }
    }

    // Получение списка всех пользователей (только для админа)
    public async getAllUsers(requesterId: string, requesterRole: UserRole): Promise<IUserResponse[]> {
        try {
            // Только админ может получить список всех пользователей
            if (requesterRole !== UserRole.ADMIN) {
                throw new Error('Access denied. Admin role required');
            }

            const users = await UsersRepository.getAllUsers();
            
            this.logger.info(`All users retrieved by admin: ${requesterId}`);
            return users.map(user => this.mapUserToResponse(user));

        } catch (error: any) {
            this.logger.error(`Failed to get all users: ${error.message}`);
            throw error;
        }
    }

    // Блокировка/разблокировка пользователя
    public async setUserActiveStatus(
        userId: string, 
        isActive: boolean, 
        requesterId: string, 
        requesterRole: UserRole
    ): Promise<IUserResponse> {
        try {
            // Проверяем права доступа: админ может блокировать любого, пользователь только себя
            if (requesterRole !== UserRole.ADMIN && userId !== requesterId) {
                throw new Error('Access denied');
            }

            // Проверяем, что пользователь существует
            const existingUser = await UsersRepository.getUserById(userId);
            if (!existingUser) {
                throw new Error('User not found');
            }

            // Нельзя заблокировать себя, если ты админ (чтобы не потерять доступ)
            if (requesterRole === UserRole.ADMIN && userId === requesterId && !isActive) {
                throw new Error('Admin cannot block themselves');
            }

            const updatedUser = await UsersRepository.setUserActiveStatus(userId, isActive);
            if (!updatedUser) {
                throw new Error('Failed to update user status');
            }

            const action = isActive ? 'activated' : 'blocked';
            this.logger.info(`User ${userId} ${action} by ${requesterId}`);
            
            return this.mapUserToResponse(updatedUser);

        } catch (error: any) {
            this.logger.error(`Failed to set user active status: ${error.message}`);
            throw error;
        }
    }

    // Получение информации о текущем пользователе
    public async getCurrentUser(userId: string): Promise<IUserResponse> {
        try {
            const user = await UsersRepository.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            this.logger.info(`Current user info retrieved: ${userId}`);
            return this.mapUserToResponse(user);

        } catch (error: any) {
            this.logger.error(`Failed to get current user ${userId}: ${error.message}`);
            throw error;
        }
    }

    // Проверка, является ли пользователь активным
    public async isUserActive(userId: string): Promise<boolean> {
        try {
            const user = await UsersRepository.getUserById(userId);
            return user ? user.is_active : false;
        } catch (error: any) {
            this.logger.error(`Failed to check if user is active ${userId}: ${error.message}`);
            return false;
        }
    }

    // Маппинг пользователя в ответ (без пароля)
    private mapUserToResponse(user: IUser): IUserResponse {
        return {
            id: user.id,
            full_name: user.full_name,
            birth_date: user.birth_date,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at
        };
    }
}

export default UsersService.getInstance();