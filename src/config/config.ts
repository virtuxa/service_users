import dotenv from 'dotenv';

import Logger from '../logger/logger';

class Config {
    private readonly logger = new Logger(Config.name);
    private static instance: Config;

    private constructor() {
        const result = dotenv.config();
        if (result.error) {
            this.logger.warning(`Could not load .env file: ${result.error.message}`);
            this.logger.info('Using environment variables from system/container');
        } else {
            this.logger.info('Environment variables loaded from .env file');
        }
    }

    public static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }
    
    public getKey(key: string): string {
        try {
            const value = process.env[key];
            if (!value) {
                this.logger.error(`Environment variable ${key} is not set.`);
                process.exit(1);
            }
            return value;
        } catch (error) {
            this.logger.error(`Error getting environment variable ${key}: ${error}`);
            process.exit(1);
        }
    }
}

export default Config.getInstance();