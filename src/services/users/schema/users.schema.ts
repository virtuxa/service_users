export const usersSchemaSQL = `
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ФИО (полное имя)
    full_name VARCHAR(255) NOT NULL,
    
    -- Дата рождения
    birth_date DATE NOT NULL,
    
    -- Email - уникальное значение
    email VARCHAR(100) NOT NULL UNIQUE,
    
    -- Пароль
    password VARCHAR(255) NOT NULL,
    
    -- Роль - либо admin либо user
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    
    -- Статус пользователя - активный или нет
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/* ---------------------------- Функции ---------------------------- */
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

/* ---------------------------- Триггеры ---------------------------- */
CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`; 