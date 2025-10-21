# Chopcheck

## Что нужно установить

Gрежде чем начать, убедитесь что у вас установлены следующие инструменты:

### 1. Bun.js
Cамый быстрый способ - через curl:
```bash
curl -fsSL https://bun.sh/install | bash
```

Для windows используйте powershell:
```powershell
powershell -c "irm bun.sh/install.ps1|iex"
```

После установки проверьте версию:
```bash
bun --version
```

### 2. Docker Desktop
Скачайте и установите docker desktop для вашей платформы:
- **macOS**: https://docs.docker.com/desktop/install/mac-install/
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

После установки запустите docker desktop и убедитесь что он работает:
```bash
docker --version
docker compose version
```

### 3. Git (если еще не установлен)
```bash
# macOS (через homebrew)
brew install git

# windows (через winget)
winget install Git.Git

# linux
sudo apt install git  # debian/ubuntu
sudo dnf install git  # fedora
```

## Клонирование репозитория

```bash
git clone https://github.com/nowhere-team/chopcheck.git
cd chopcheck
```

## Запуск базы данных и кэша

Поднимаем postgresql и redis через docker compose:

```bash
docker compose up -d
```

Это запустит:
- **postgres** на порту `5432` с базой данных `chopcheck`
- **redis** на порту `6379`

Проверить что контейнеры запущены:
```bash
docker compose ps
```

Должны увидеть оба сервиса в статусе `running`.

## Настройка переменных окружения

### 1. Устанавливаем зависимости

```bash
bun install
```

Это установит все зависимости для всех сервисов (frontend, backend, telegram) благодаря bun workspaces.

### 2. Настройка бэкенда (обязательно)

Создайте файл `.env` в `services/backend`:

```bash
cd services/backend
cp .env.example .env
```

Откройте `.env` и **обязательно измените**:

**Критически важные переменные:**
- `JWT_SECRET` - строка минимум 32 символа
  ```bash
  # сгенерировать можно так или на сайте https://jwtsecrets.com/:
  openssl rand -base64 32
  ```

**Переменные по умолчанию** (можно не менять для разработки):
```env
DATABASE_URL=postgresql://chopcheck:chopcheck_dev_password@localhost:5432/chopcheck
CACHE_TYPE=redis
CACHE_URL=redis://localhost:6379
PORT=8080
LOG_LEVEL=debug
```

### 3. Настройка telegram бота (если запускаете бот)

Создайте файл `.env` в `services/telegram`:

```bash
cd services/telegram
cp .env.example .env
```

Измените:
- `TELEGRAM_BOT_TOKEN` - получите у [@BotFather](https://t.me/BotFather)
    ```
    /newbot -> следуйте инструкциям
    ```
- `TELEGRAM_WEB_APP_URL` - url фронтенда (для разработки: `http://localhost:5173`)

### 4. Настройка фронтенда (опционально)

Создайте файл `.env` в `services/frontend`:

```bash
cd services/frontend
cp .env.example .env
```

По умолчанию фронтенд подключается к `http://localhost:8080/api`. Если ваш бэкенд на другом порту - измените `VITE_API_URL`.

### 5. Выполняем миграции базы данных

Вернитесь в `services/backend` и выполните миграции:

```bash
cd services/backend
bun run db:migrate
```

Это создаст все необходимые таблицы в postgresql.

**Полезные команды для работы с базой данных:**
```bash
# генерация новых миграций после изменения схемы
bun run db:generate

# применить миграции напрямую без файлов (осторожно!)
bun run db:push

# открыть drizzle studio для просмотра данных
bun run db:studio
```

## Запуск сервисов

Есть несколько вариантов запуска в зависимости от того, что вы разрабатываете:

### Только бэкенд
Если вам нужен только api сервер:

```bash
# из корня проекта
bun run dev:back

# или из services/backend
cd services/backend
bun run dev
```

Бэкенд будет доступен на `http://localhost:8080`

### Фронтенд + telegram (без бэкенда)
Если бэкенд уже запущен где-то (например на сервере):

```bash
bun run dev:ft
```

### Все сервисы одновременно
Для полноценной разработки фронтенда:

```bash
bun run dev:all
```

Это запустит:
- **backend** на порту `8080`
- **frontend** на порту `5173` (vite dev server)
- **telegram** бота

## Для разработки фронтенда с telegram

Если вы работаете над фронтендом и хотите тестировать telegram miniapp:

### 1. Установите telegram beta


### 2. Создайте тестового бота
Откройте [@BotFather](https://t.me/BotFather) в telegram beta и выполните:
```
/newbot
```

Следуйте инструкциям и получите токен для тестового окружения.

### 3. Настройте miniapp
В настройках бота через botfather установите url для miniapp:
```
/newapp
```

Укажите URL вашего локального сервера.

## Полезные команды

```bash
# остановить docker контейнеры
docker compose down

# остановить и удалить данные
docker compose down -v

# посмотреть логи postgres
docker compose logs postgres

# посмотреть логи redis
docker compose logs redis

# подключиться к postgres
docker compose exec postgres psql -U chopcheck -d chopcheck

# очистить кэш redis
docker compose exec redis redis-cli FLUSHALL
```

## Структура проекта

```
chopcheck/
├── services/
│   ├── backend/       # hono.js api сервер
│   ├── frontend/      # sveltekit приложение
│   └── telegram/      # telegram bot (grammy)
├── docker-compose.yml # postgres + redis
└── package.json       # workspace root
```

## Troubleshooting

### База данных не подключается
Проверьте что docker контейнеры запущены:
```bash
docker compose ps
```

Если postgres не healthy:
```bash
docker compose logs postgres
```

### Миграции не применяются
Убедитесь что `DATABASE_URL` в `.env` правильный и postgres доступен:
```bash
docker compose exec postgres psql -U chopcheck -d chopcheck -c "SELECT 1;"
```

### Порты заняты
Усли порты 5432 или 6379 заняты другими сервисами, измените их в `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # изменили внешний порт
```

Не забудьте обновить `DATABASE_URL` в `.env` соответственно.

### Bun command not found
Убедитесь что путь к bun добавлен в `PATH`. после установки перезапустите терминал или выполните:
```bash
source ~/.bashrc  # linux
source ~/.zshrc   # macOS с zsh
```

## Что дальше?

После успешного запуска:

1. Откройте api docs: http://localhost:8080/docs (если backend поддерживает)
2. Откройте frontend: http://localhost:5173
3. Проверьте работу telegram бота

Если что-то не работает - проверьте логи сервисов, они дадут подробную информацию об ошибках.

---
