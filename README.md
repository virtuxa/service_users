## Описание проекта

### Использованы технологии
1. **Express.js** - веб-фреймворк
2. **TypeScript** - строгая типизация
3. **PostgreSQL** - база данных
4. **JWT** - аутентификация
5. **bcrypt** - хеширование паролей
6. **pg** - драйвер PostgreSQL

### Реализованы все endpoints:
1. **Регистрация пользователя** - `POST /api/auth/register`
2. **Авторизация пользователя** - `POST /api/auth/login` (JWT)
3. **Получение пользователя по ID** - `GET /api/users/:id` (Админ или сам пользователь)
4. **Получение списка пользователей** - `GET /api/users` (Только админ)
5. **Блокировка пользователя** - `PATCH /api/users/:id/status` (Админ или сам пользователь)

### Дополнительные endpoints:
1. `GET /api/users/me` - Получение информации о текущем пользователе
2. `POST /api/auth/refresh` - Обновление access токена

### Структура проекта:
```
src/
├── services/
│   ├── auth/              # Аутентификация
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── utils/auth.utils.ts
│   └── users/             # Пользователи
│       ├── users.controller.ts
│       ├── users.service.ts
│       ├── repositories/users.repository.ts
│       ├── types/users.interfaces.ts
│       └── schema/users.schema.ts
├── routes/
│   ├── router.ts
│   └── middlewares/middleware.rest.ts
├── storage/postgres.storage.ts
├── config/config.ts
├── logger/logger.ts
└── types/rest.ts
```
---

## Запуск проекта

1. **Установка зависимостей:**
```bash
npm install
```

2. **Копирование env.example:**
```bash
copy .env.example .env
```

3. **Запуск в режиме разработки:**
```bash
npm run dev
```

4. **Обычный запуск:**
```bash
npm run build
npm start
```