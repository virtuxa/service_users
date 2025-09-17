export enum UserRole {
    ADMIN = 'admin',
    USER = 'user'
}

export interface IUser {
    id: string;
    full_name: string;
    birth_date: Date;
    email: string;
    password: string;
    role: UserRole;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface IUserCreateData {
    full_name: string;
    birth_date: Date;
    email: string;
    password: string;
    role?: UserRole;
}

export interface IUserUpdateData {
    full_name?: string;
    birth_date?: Date;
    email?: string;
    password?: string;
    role?: UserRole;
    is_active?: boolean;
}

export interface IUserResponse {
    id: string;
    full_name: string;
    birth_date: Date;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IRegisterRequest {
    full_name: string;
    birth_date: Date;
    email: string;
    password: string;
}

export interface IAuthResponse {
    user: IUserResponse;
    accessToken: string;
    refreshToken: string;
}