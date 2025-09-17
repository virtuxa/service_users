// Storage
import storage from '../../../storage/postgres.storage';

// Schema
import { usersSchemaSQL } from '../schema/users.schema';

// Logger
import Logger from '../../../logger/logger';

// Types
import { IUser, IUserCreateData, IUserUpdateData, UserRole } from '../types/users.interfaces';

class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);
    private static instance: UsersRepository;
    private readonly tableName = 'users';

    private constructor() {}

    public static getInstance(): UsersRepository {
        if (!UsersRepository.instance) {
            UsersRepository.instance = new UsersRepository();
        }
        return UsersRepository.instance;
    }

    public async initSchema(): Promise<void> {
        try {
            await storage.query({ text: usersSchemaSQL });
            this.logger.info('Users schema initialized successfully.');
        } catch (error: any) {
            this.logger.error(`Failed to initialize Users schema: ${error.message}`);
            throw error;
        }
    }

    // Создание пользователя
    public async createUser(userData: IUserCreateData): Promise<IUser> {
        try {
            const result = await storage.insert(this.tableName, {
                full_name: userData.full_name,
                birth_date: userData.birth_date,
                email: userData.email,
                password: userData.password,
                role: userData.role || UserRole.USER
            });

            return this.mapDbUserToUser(result.rows[0]);
        } catch (error: any) {
            this.logger.error(`Failed to create user: ${error.message}`);
            throw error;
        }
    }

    // Получение пользователя по ID
    public async getUserById(id: string): Promise<IUser | null> {
        try {
            const result = await storage.select(this.tableName, { id });
            
            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbUserToUser(result.rows[0]);
        } catch (error: any) {
            this.logger.error(`Failed to get user by ID ${id}: ${error.message}`);
            throw error;
        }
    }

    // Получение пользователя по email
    public async getUserByEmail(email: string): Promise<IUser | null> {
        try {
            const result = await storage.select(this.tableName, { email });
            
            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbUserToUser(result.rows[0]);
        } catch (error: any) {
            this.logger.error(`Failed to get user by email ${email}: ${error.message}`);
            throw error;
        }
    }

    // Получение всех пользователей
    public async getAllUsers(): Promise<IUser[]> {
        try {
            const result = await storage.select(this.tableName, undefined, 'created_at DESC');
            
            return result.rows.map(row => this.mapDbUserToUser(row));
        } catch (error: any) {
            this.logger.error(`Failed to get all users: ${error.message}`);
            throw error;
        }
    }

    // Обновление пользователя
    public async updateUser(id: string, updateData: IUserUpdateData): Promise<IUser | null> {
        try {
            const result = await storage.update(this.tableName, updateData, { id });
            
            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbUserToUser(result.rows[0]);
        } catch (error: any) {
            this.logger.error(`Failed to update user ${id}: ${error.message}`);
            throw error;
        }
    }

    // Блокировка/разблокировка пользователя
    public async setUserActiveStatus(id: string, isActive: boolean): Promise<IUser | null> {
        try {
            const result = await storage.update(this.tableName, { is_active: isActive }, { id });
            
            if (result.rows.length === 0) {
                return null;
            }

            return this.mapDbUserToUser(result.rows[0]);
        } catch (error: any) {
            this.logger.error(`Failed to set user ${id} active status to ${isActive}: ${error.message}`);
            throw error;
        }
    }

    // Удаление пользователя
    public async deleteUser(id: string): Promise<boolean> {
        try {
            const result = await storage.delete(this.tableName, { id });
            
            return result.rows.length > 0;
        } catch (error: any) {
            this.logger.error(`Failed to delete user ${id}: ${error.message}`);
            throw error;
        }
    }

    // Проверка существования пользователя по email
    public async isEmailExists(email: string): Promise<boolean> {
        try {
            const result = await storage.select(this.tableName, { email });
            return result.rows.length > 0;
        } catch (error: any) {
            this.logger.error(`Failed to check if email exists ${email}: ${error.message}`);
            throw error;
        }
    }

    // Маппинг данных из БД в интерфейс пользователя
    private mapDbUserToUser(dbUser: any): IUser {
        return {
            id: dbUser.id,
            full_name: dbUser.full_name,
            birth_date: new Date(dbUser.birth_date),
            email: dbUser.email,
            password: dbUser.password,
            role: dbUser.role as UserRole,
            is_active: dbUser.is_active,
            created_at: new Date(dbUser.created_at),
            updated_at: new Date(dbUser.updated_at)
        };
    }
}

export default UsersRepository.getInstance();