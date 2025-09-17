import http from "http";
import express from "express";

import Logger from "./logger/logger";
import Config from "./config/config";
import router from "./routes/router";
import PostgresStorage from "./storage/postgres.storage";

// Создаем логгер
const logger = new Logger("Server");

// Получаем конфигурацию
const host = Config.getKey("SV_HOST");
const port = parseInt(Config.getKey("SV_PORT"));

// Создаем экземпляр приложения
const app = express();
app.use(express.json());

// Создаем http-сервер на базе express
const httpServer = http.createServer(app);

// Асинхронная функция запуска сервера
async function startServer() {
    try {
        // Инициализируем storage и ждем завершения
        await PostgresStorage.initStorage();

        // Подключаем router
        app.use(router);
        
        // Запускаем httpServer
        httpServer.listen(port, host, () => {
            logger.info(`SERVER IS RUNNING ON ${host}:${port}`);
        });

    } catch (error) {
        logger.fatal(`Failed to start server: ${(error as Error).message}`);
        process.exit(1);
    }
}

// Запускаем сервер
startServer();