// JWT
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Config
import Config from "../../../config/config";

// Logger
import Logger from "../../../logger/logger";

interface ITokenPayload {
    user: {
        id: string;
        email: string;
        role: string;
    };
    iat: number;
    exp: number;
}

class AuthUtils {
    private readonly logger = new Logger(AuthUtils.name);
    private static instance: AuthUtils;

    private constructor() {}

    public static getInstance(): AuthUtils {
        if (!AuthUtils.instance) {
            AuthUtils.instance = new AuthUtils();
        }
        return AuthUtils.instance;
    }

    // Создание access токена
    public createAccessToken = (payload: { id: string; email: string; role: string }): string => {
        const secret = Config.getKey('JWT_TOKEN_ACCESS_SECRET');
        const expiresIn = Config.getKey('JWT_TOKEN_ACCESS_EXPIRES_IN');

        return jwt.sign(
            { user: payload },
            secret,
            { expiresIn: parseInt(expiresIn) }
        );
    }

    // Создание refresh токена
    public createRefreshToken = (payload: { id: string; email: string; role: string }): string => {
        const secret = Config.getKey('JWT_TOKEN_REFRESH_SECRET');
        const expiresIn = Config.getKey('JWT_TOKEN_REFRESH_EXPIRES_IN');

        return jwt.sign(
            { user: payload },
            secret,
            { expiresIn: parseInt(expiresIn) }
        );
    }

    // Проверка access токена
    public verifyTokenAccess = async (token: string): Promise<ITokenPayload> => {
        try {
            const secret = Config.getKey('JWT_TOKEN_ACCESS_SECRET');
            const decoded = jwt.verify(token, secret) as ITokenPayload;
            return decoded;
        } catch (error: any) {
            this.logger.error(`Failed to verify access token: ${error.message}`);
            throw new Error('Invalid access token');
        }
    }

    // Проверка refresh токена
    public verifyTokenRefresh = async (token: string): Promise<ITokenPayload> => {
        try {
            const secret = Config.getKey('JWT_TOKEN_REFRESH_SECRET');
            const decoded = jwt.verify(token, secret) as ITokenPayload;
            return decoded;
        } catch (error: any) {
            this.logger.error(`Failed to verify refresh token: ${error.message}`);
            throw new Error('Invalid refresh token');
        }
    }

    // Хеширование пароля
    public hashPassword = async (password: string): Promise<string> => {
        try {
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            return hashedPassword;
        } catch (error: any) {
            this.logger.error(`Failed to hash password: ${error.message}`);
            throw new Error('Failed to hash password');
        }
    }

    // Проверка пароля
    public comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
        try {
            const isMatch = await bcrypt.compare(password, hashedPassword);
            return isMatch;
        } catch (error: any) {
            this.logger.error(`Failed to compare password: ${error.message}`);
            throw new Error('Failed to compare password');
        }
    }

    // Валидация email
    public validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Валидация пароля (минимум 6 символов)
    public validatePassword = (password: string): boolean => {
        return password.length >= 6;
    }
}

export default AuthUtils.getInstance();