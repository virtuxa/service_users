// Utils
import AuthUtils from "./utils/auth.utils";

// Repositories
import UsersRepository from "../users/repositories/users.repository";

// Types
import { 
    ILoginRequest, 
    IRegisterRequest, 
    IAuthResponse, 
    IUserResponse,
    UserRole,
    IUser
} from "../users/types/users.interfaces";

// Logger
import Logger from "../../logger/logger";

class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private static instance: AuthService;

    private constructor() {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Регистрация пользователя
    public async register(registerData: IRegisterRequest): Promise<IAuthResponse> {
        try {
            // Валидация данных
            this.validateRegisterData(registerData);

            // Проверяем, что email не занят
            const emailExists = await UsersRepository.isEmailExists(registerData.email);
            if (emailExists) {
                throw new Error('Email already exists');
            }

            // Хешируем пароль
            const hashedPassword = await AuthUtils.hashPassword(registerData.password);

            // Создаем пользователя
            const user = await UsersRepository.createUser({
                full_name: registerData.full_name,
                birth_date: registerData.birth_date,
                email: registerData.email,
                password: hashedPassword,
                role: UserRole.USER // По умолчанию роль user
            });

            // Создаем токены
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = AuthUtils.createAccessToken(tokenPayload);
            const refreshToken = AuthUtils.createRefreshToken(tokenPayload);

            this.logger.info(`User registered successfully: ${user.email}`);

            return {
                user: this.mapUserToResponse(user),
                accessToken,
                refreshToken
            };

        } catch (error: any) {
            this.logger.error(`Registration failed: ${error.message}`);
            throw error;
        }
    }

    // Авторизация пользователя
    public async login(loginData: ILoginRequest): Promise<IAuthResponse> {
        try {
            // Валидация данных
            this.validateLoginData(loginData);

            // Находим пользователя по email
            const user = await UsersRepository.getUserByEmail(loginData.email);
            if (!user) {
                throw new Error('Invalid credentials');
            }

            // Проверяем, что пользователь активен
            if (!user.is_active) {
                throw new Error('User account is blocked');
            }

            // Проверяем пароль
            const isPasswordValid = await AuthUtils.comparePassword(loginData.password, user.password);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            // Создаем токены
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const accessToken = AuthUtils.createAccessToken(tokenPayload);
            const refreshToken = AuthUtils.createRefreshToken(tokenPayload);

            this.logger.info(`User logged in successfully: ${user.email}`);

            return {
                user: this.mapUserToResponse(user),
                accessToken,
                refreshToken
            };

        } catch (error: any) {
            this.logger.error(`Login failed: ${error.message}`);
            throw error;
        }
    }

    // Обновление токена по refresh токену
    public async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            // Проверяем refresh токен
            const decoded = await AuthUtils.verifyTokenRefresh(refreshToken);

            // Получаем пользователя
            const user = await UsersRepository.getUserById(decoded.user.id);
            if (!user) {
                throw new Error('User not found');
            }

            // Проверяем, что пользователь активен
            if (!user.is_active) {
                throw new Error('User account is blocked');
            }

            // Создаем новые токены
            const tokenPayload = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            const newAccessToken = AuthUtils.createAccessToken(tokenPayload);
            const newRefreshToken = AuthUtils.createRefreshToken(tokenPayload);

            this.logger.info(`Token refreshed for user: ${user.email}`);

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };

        } catch (error: any) {
            this.logger.error(`Token refresh failed: ${error.message}`);
            throw error;
        }
    }

    // Валидация данных регистрации
    private validateRegisterData(data: IRegisterRequest): void {
        if (!data.full_name || data.full_name.trim().length < 2) {
            throw new Error('Full name must be at least 2 characters long');
        }

        if (!data.email || !AuthUtils.validateEmail(data.email)) {
            throw new Error('Invalid email format');
        }

        if (!data.password || !AuthUtils.validatePassword(data.password)) {
            throw new Error('Password must be at least 6 characters long');
        }

        if (!data.birth_date) {
            throw new Error('Birth date is required');
        }

        // Проверяем, что дата рождения корректна
        const birthDate = new Date(data.birth_date);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 13 || age > 120) {
            throw new Error('Invalid birth date');
        }
    }

    // Валидация данных авторизации
    private validateLoginData(data: ILoginRequest): void {
        if (!data.email || !AuthUtils.validateEmail(data.email)) {
            throw new Error('Invalid email format');
        }

        if (!data.password) {
            throw new Error('Password is required');
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

export default AuthService.getInstance();