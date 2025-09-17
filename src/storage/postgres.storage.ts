import { Pool, QueryResult } from "pg";

// Config
import Config from "../config/config";

// Logger
import Logger from "../logger/logger";

// Импортируем репозитории, чьи схемы нужно инициализировать
import UsersRepository from "../services/users/repositories/users.repository";

const logger = new Logger("PostgresStorage");

interface IQueryParams {
    text: string;
    values?: any[];
}

class PostgresStorage {
    private static instance: PostgresStorage;
    private pool: Pool | null = null;

    private constructor() { }

    public static getInstance(): PostgresStorage {
        if (!PostgresStorage.instance) {
            PostgresStorage.instance = new PostgresStorage();
        }
        return PostgresStorage.instance;
    }

    // Инициализация подключения к базе данных
    private async initConnection() {
        try {
            this.pool = new Pool({
                host: Config.getKey('STORAGE_PG_HOST'),
                port: parseInt(Config.getKey('STORAGE_PG_PORT')),
                user: Config.getKey('STORAGE_PG_USER'),
                password: Config.getKey('STORAGE_PG_PASS'),
                database: Config.getKey('STORAGE_PG_NAME'),
                max: 20, // максимальное количество соединений в пуле
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Проверяем подключение
            await this.pool.query('SELECT NOW()');
            logger.info(`Connected to PostgreSQL database: ${Config.getKey('STORAGE_PG_NAME')}`);
        } catch (error) {
            logger.fatal(`Failed to connect to PostgreSQL: ${(error as Error).message}`);
            process.exit(1);
        }
    }

    // Инициализация схем
    private async initSchema() {
        try {
            if (!this.pool) {
                throw new Error("Database connection not initialized for schema init");
            }

            // Вызываем инициализацию схемы
            await UsersRepository.initSchema();
        } catch (error) {
            logger.fatal(`Failed to initialize schemas: ${(error as Error).message}`);
            process.exit(1);
        }
    }
    
    // Инициализация хранилища
    public async initStorage() {
        try {
            await this.initConnection();
            await this.initSchema();
            logger.info("PostgreSQL storage initialized successfully.");
        } catch (error) {
            logger.fatal(`Critical error during storage initialization: ${(error as Error).message}`);
            process.exit(1);
        }
    }

    // Выполнение произвольного SQL запроса
    public async query(queryParams: IQueryParams): Promise<QueryResult> {
        if (!this.pool) {
            logger.error("Query attempted before database connection was initialized.");
            throw new Error("Database connection not initialized");
        }

        try {
            const result = await this.pool.query(queryParams.text, queryParams.values);
            return result;
        } catch (error: any) {
            logger.error(`Query execution failed: ${error.message}`);
            logger.debug(`Failed query: ${queryParams.text} with values: ${JSON.stringify(queryParams.values)}`);
            throw error;
        }
    }

    /**
     * Базовые CRUD операции
     */

    // CREATE
    public async insert(table: string, data: Record<string, any>): Promise<QueryResult> {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
        
        const queryText = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        
        return this.query({ text: queryText, values });
    }

    // READ
    public async select(table: string, where?: Record<string, any>, orderBy?: string): Promise<QueryResult> {
        let queryText = `SELECT * FROM ${table}`;
        let values: any[] = [];

        if (where && Object.keys(where).length > 0) {
            const whereKeys = Object.keys(where);
            const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
            queryText += ` WHERE ${whereClause}`;
            values = Object.values(where);
        }

        if (orderBy) {
            queryText += ` ORDER BY ${orderBy}`;
        }

        return this.query({ text: queryText, values });
    }

    // UPDATE
    public async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<QueryResult> {
        const dataKeys = Object.keys(data);
        const whereKeys = Object.keys(where);
        
        const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
        const whereClause = whereKeys.map((key, index) => `${key} = $${dataKeys.length + index + 1}`).join(' AND ');
        
        const queryText = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
        const values = [...Object.values(data), ...Object.values(where)];

        return this.query({ text: queryText, values });
    }

    // DELETE
    public async delete(table: string, where: Record<string, any>): Promise<QueryResult> {
        const whereKeys = Object.keys(where);
        const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');
        
        const queryText = `DELETE FROM ${table} WHERE ${whereClause} RETURNING *`;
        const values = Object.values(where);

        return this.query({ text: queryText, values });
    }

    /**
     * Проверка состояния подключения
     */
    public async healthCheck(): Promise<boolean> {
        try {
            if (!this.pool) return false;
            await this.pool.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Получение информации о пуле соединений
     */
    public getPoolInfo(): any {
        if (!this.pool) return null;
        
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
        };
    }
}

export default PostgresStorage.getInstance();