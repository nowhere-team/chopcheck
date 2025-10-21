# ChopCheck Cheatsheet

## Первоначальная настройка

```bash
# клонирование
git clone https://github.com/nowhere-team/chopcheck.git
cd chopcheck

# установка зависимостей
bun install

# запуск базы данных
docker compose up -d

# настройка бэкенда
cd services/backend
cp .env.example .env
# отредактируйте .env (обязательно: JWT_SECRET

# применение миграций
bun run db:migrate

# вернуться в корень
cd ../..
```

## Ежедневная работа

### Запуск сервисов

```bash
# только бэкенд
bun run dev:back

# фронтенд + telegram (бэкенд отдельно)
bun run dev:ft

# все сразу
bun run dev:all
```

### Работа с docker

```bash
# запустить контейнеры
docker compose up -d

# остановить
docker compose down

# посмотреть логи
docker compose logs postgres
docker compose logs redis

# полная очистка с данными
docker compose down -v

# перезапустить один сервис
docker compose restart postgres
```

### Работа с базой данных

```bash
cd services/backend

# применить миграции
bun run db:migrate

# сгенерировать новые миграции после изменения схемы
bun run db:generate

# синхронизировать схему напрямую (для разработки)
bun run db:push

# открыть drizzle studio
bun run db:studio
```

### Подключение к базе данных

```bash
# через docker
docker compose exec postgres psql -U chopcheck -d chopcheck

# локально (если установлен psql)
psql postgresql://chopcheck:chopcheck_dev_password@localhost:5432/chopcheck
```

Полезные sql команды:
```sql
-- список таблиц
\dt

-- структура таблицы
\d splits

-- выход
\q
```

### Работа с redis

```bash
# подключение к redis
docker compose exec redis redis-cli

# очистить весь кэш
docker compose exec redis redis-cli FLUSHALL

# посмотреть все ключи
docker compose exec redis redis-cli KEYS '*'

# получить значение
docker compose exec redis redis-cli GET cc:some:key
```

## Переменные окружения

### backend (.env в services/backend)

```env
DATABASE_URL=postgresql://chopcheck:chopcheck_dev_password@localhost:5432/chopcheck
JWT_SECRET=<минимум-32-символа>
TELEGRAM_BOT_TOKEN=<токен-из-botfather>
CACHE_TYPE=redis
CACHE_URL=redis://localhost:6379
PORT=8080
LOG_LEVEL=debug
```

### telegram (.env в services/telegram)

```env
TELEGRAM_BOT_TOKEN=<тот-же-токен>
TELEGRAM_WEB_APP_URL=http://localhost:5173
LOG_LEVEL=debug
```

### frontend (.env в services/frontend)

```env
VITE_API_URL=http://localhost:8080/api
```

## Отладка

### Проверка что все работает

```bash
# postgres доступен
docker compose exec postgres psql -U chopcheck -d chopcheck -c "SELECT 1;"

# redis доступен
docker compose exec redis redis-cli ping

# бэкенд отвечает
curl http://localhost:8080/api/health

# фронтенд открывается
open http://localhost:5173
```

### Частые проблемы

**Порты заняты:**
```bash
# найти процесс на порту
lsof -i :5432  # postgres
lsof -i :6379  # redis
lsof -i :8080  # backend
lsof -i :5173  # frontend

# убить процесс
kill -9 <PID>
```

**Миграции не применяются:**
```bash
# проверить подключение
docker compose ps

# посмотреть логи postgres
docker compose logs postgres

# пересоздать базу
docker compose down -v
docker compose up -d
cd services/backend && bun run db:migrate
```

**Кэш redis не работает:**
```bash
# в .env бэкенда поменять на memory cache
CACHE_TYPE=memory
```

## Полезные линки

- api docs: http://localhost:8080/docs (если настроено)
- frontend: http://localhost:5173
- drizzle studio: `bun run db:studio` (из services/backend)
- telegram botfather: https://t.me/BotFather
- telegram beta: https://telegram.org/android

## для создания telegram bot

```
1. открыть @BotFather в telegram
2. отправить /newbot
3. следовать инструкциям
4. скопировать токен в .env файлы
5. настроить miniapp через /newapp (для фронтенда)
```

для разработки фронтенда используйте telegram beta с test сервером!

## git workflow

```bash
# перед началом работы
git pull origin main
bun install  # на случай если обновились зависимости

# после изменения схемы базы
cd services/backend
bun run db:generate
git add migrations/
git commit -m "database: добавлена таблица X"

# обычный коммит
git add .
git commit -m "feat: описание изменений"
git push origin <ваша-ветка>
```

## структура проекта

```
chopcheck/
├── docker-compose.yml      # postgres + redis
├── package.json            # root workspace
├── services/
│   ├── backend/            # hono.js api
│   │   ├── src/
│   │   ├── migrations/     # drizzle миграции
│   │   └── package.json
│   ├── frontend/           # sveltekit
│   │   ├── src/
│   │   └── package.json
│   └── telegram/           # grammy bot
│       ├── src/
│       └── package.json
└── README.md
```