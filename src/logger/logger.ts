import winston, { format, transports } from "winston";

// Определяем кастомные уровни и цвета для логгера
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    net: 4,
    debug: 5,
  },
  colors: {
    fatal: "brightRed",
    error: "red",
    warning: "yellow",
    info: "green",
    net: "blue",
    debug: "magenta",
  },
};

// Добавляем цвета в winston
winston.addColors(customLevels.colors);

class Logger {
  private logger: winston.Logger;

  constructor(serviceName: string) {
    // Форматтер для консоли: с цветами и кастомным выводом
    const consolePrintf = format.printf((info) => {
      const timestamp = info.timestamp as string;
      // info.level
      const colorizedLevel = info.level as string;
      // info[Symbol.for('level')]
      const originalLevelText = info[Symbol.for('level')] as string;
      const message = info.message as string;

      const finalDisplayLevel = colorizedLevel.replace(originalLevelText, originalLevelText.toUpperCase().substring(0, 3));

      // Добавляем цвет для имени сервиса
      const coloredServiceName = `\x1b[96m${serviceName}\x1b[39m`;
      
      // Извлекаем цветовой код из окрашенного уровня
      const colorMatch = colorizedLevel.match(/\x1b\[\d+m/);
      const levelColor = colorMatch ? colorMatch[0] : '';
      
      // Окрашиваем сообщение в цвет уровня
      const coloredMessage = levelColor ? `${levelColor}${message}\x1b[39m` : message;
      
      return `${timestamp}: [${finalDisplayLevel}] [${coloredServiceName}] ${coloredMessage}`;
    });

    const consoleFormat = format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.colorize(),
      consolePrintf
    );

    const filePrintf = format.printf(({ level, message, timestamp }) => {
      const uppercasedLevel = level.toUpperCase();
      return `${timestamp}: ${uppercasedLevel}: ${serviceName}: ${message}`;
    });

    const fileFormat = format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.uncolorize(),
      filePrintf
    );

    this.logger = winston.createLogger({
      levels: customLevels.levels,
      transports: [
        // Консоль
        new transports.Console({
          level: "debug",
          format: consoleFormat,
        }),
        // Файлы
        new transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: fileFormat, 
        }),
        // Файлы
        new transports.File({ 
          filename: 'logs/info.log', 
          level: 'info',
          format: fileFormat, 
        }),
        // Файлы
        new transports.File({ 
          filename: 'logs/debug.log', 
          level: 'debug',
          format: fileFormat, 
        }),
      ]
    });
  }

  public fatal(message: string, ...meta: any[]): void {
    this.logger.log("fatal", message, ...meta);
  }

  public error(message: string, ...meta: any[]): void {
    this.logger.error(message, ...meta);
  }

  public warning(message: string, ...meta: any[]): void {
    this.logger.log("warning", message, ...meta);
  }

  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  public net(message: string, ...meta: any[]): void {
    this.logger.log("net", message, ...meta);
  }

  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }
}

export default Logger;