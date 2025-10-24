# Git workflow для ChopCheck
Этот документ описывает, как мы работаем с git и github в проекте. Следование этим правилам обеспечивает чистую историю коммитов и упрощает code review.

---

## Основной цикл разработки

### 1. Начало работы над задачей

Перед началом всегда синхронизируемся с актуальным состоянием main:

```bash
# переключаемся на main и подтягиваем изменения
git checkout main
git pull origin main

# обновляем зависимости если нужно
bun install
```

### 2. Создание ветки

Каждая задача делается в отдельной ветке. Именование веток:

- `feat/описание` — новая функциональность
- `fix/описание` — исправление бага
- `refactor/описание` — рефакторинг без изменения функциональности
- `docs/описание` — изменения в документации

```bash
# примеры хороших названий веток
git checkout -b feat/payment-methods
git checkout -b fix/split-calculation-bug
git checkout -b refactor/auth-service-cleanup
```

**Важно:** используйте английский в названиях веток и коммитов — так принято в разработке.

### 3. Работа в ветке

Делайте коммиты по мере работы. Не обязательно делать один большой коммит — лучше несколько логических. при мёрже они всё равно склеятся в один.

```bash
# добавляем изменения
git add .

# коммитим с понятным сообщением
git commit -m "feat: add payment method model"

# продолжаем работу
git add .
git commit -m "feat: add payment methods endpoint"

# ещё немного
git add .
git commit -m "feat: connect payment methods to frontend"
```

### 4. Синхронизация с main (если работа заняла время)

Если параллельно кто-то смёржил свои изменения в main, нужно подтянуть их к себе:

```bash
# сохраняем свою работу
git add .
git commit -m "wip: сохранение перед rebase"

# переключаемся на main и обновляем
git checkout main
git pull origin main

# возвращаемся в свою ветку и интегрируем изменения
git checkout feat/payment-methods
git rebase main

# если есть конфликты — разрешаем их и продолжаем
# git add <файлы-с-конфликтами>
# git rebase --continue
```

**Альтернатива:** если rebase кажется сложным, можно использовать merge:
```bash
git checkout feat/payment-methods
git merge main
```

Но rebase чище — он не создаёт лишних merge commits.

### 5. Отправка ветки на github

```bash
git push origin feat/payment-methods

# если ветка новая, git попросит установить upstream
# просто выполните команду которую он предложит:
# git push --set-upstream origin feat/payment-methods
```

### 6. Создание pull request

1. Идём на [github.com/nowhere-team/chopcheck](https://github.com/nowhere-team/chopcheck)
2. Должен появиться жёлтый баннер **"Compare & pull request"** — нажимаем
3. Если баннера нет: вкладка **Pull Requests** → **New pull request**
4. Заполняем форму:
    - **title:** понятное название (feat: добавлены методы оплаты)
    - **description:** что сделано, зачем, на что обратить внимание при ревью
    - **reviewers:** добавляем ревьюера (обычно это техлид)
5. Жмём **Create pull request**

**Пример хорошего описания PR:**

```markdown
## Что сделано
Добавлена таблица payment_methods и crud операции для методов оплаты пользователя

## Зачем
По ТЗ создатель сплита должен указывать свой номер телефона/карту для сбп при создании

## Как проверить
1. Запустить миграцию (bun run db:migrate)
2. Создать сплит через api
3. Добавить payment method через POST /api/payment-methods
4. Проверить что метод привязался к пользователю

## Моменты для ревью
- Не уверен в валидации номера карты, может стоит усилить?
- Пока только сбп, другие методы добавим потом
```

### 7. code review

После создания PR ревьюер посмотрит код и может:
- **approve** — всё хорошо, можно мёржить
- **request changes** — нужно что-то поправить
- **comment** — просто оставить комментарии без блокировки мёржа

Если нужны правки:

```bash
# делаем изменения локально
git add .
git commit -m "fix: исправил замечания по неймингу"
git push origin feat/payment-methods

# PR обновится автоматически
# ревьюер увидит изменения и сможет заново проверить
```

### 8. Мёрж в main

После получения approve:

1. Открываем свой PR на github
2. Жмём **Squash and merge** (должна быть только эта опция)
    - все ваши коммиты склеятся в один
    - можно отредактировать финальное сообщение коммита
3. Жмём **Confirm squash and merge**
4. GitHub предложит удалить ветку — соглашаемся (Delete branch)

### 9. Обновление локального репозитория

После мёржа подтягиваем изменения локально:

```bash
# переключаемся на main
git checkout main

# обновляем
git pull origin main

# удаляем локальную ветку (она больше не нужна)
git branch -d feat/payment-methods

# если git ругается что ветка не смёржена, используем -D
# git branch -D feat/payment-methods
```

---

## Специальные случаи

### Изменения схемы базы данных

Когда меняете структуру БД, миграцию нужно коммитить отдельно:

```bash
# генерируем миграцию
cd services/backend
bun run db:generate

# коммитим ТОЛЬКО миграцию
git add migrations/
git commit -m "database: добавлена таблица payment_methods"

# потом коммитим основной код
git add .
git commit -m "feat: реализован функционал методов оплаты"

# пушим всё вместе
git push origin feat/payment-methods
```

**Почему так:** миграции влияют на всех, и если в коде ошибка, проще откатить только код, оставив миграцию.

### Откат изменений

Если смёржили что-то неправильное:

```bash
# смотрим историю коммитов
git log --oneline

# находим SHA коммита который нужно откатить
# создаём ветку для отката
git checkout -b revert/broken-feature

# откатываем коммит (создаётся новый коммит с обратными изменениями)
git revert <SHA>

# пушим и делаем PR
git push origin revert/broken-feature
```

**Важно:** не используйте `git reset` на main — это сломает историю для всех.

---

## Правила и best practices

### Обязательные правила

1. **Никогда не пушим в main напрямую** — это физически заблокировано через branch protection
2. **Все изменения только через pull request**
3. **PR мёржится только после approve** от ревьюера
4. **Используем "squash and merge"** — история остаётся чистой
5. **Все комментарии в PR должны быть resolved** перед мёржем

### Рекомендации

**Именование коммитов:**
- Начинайте с типа: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`
- Пишите в present tense: "add feature" вместо "added feature"
- Будьте конкретны: вместо "fix bug" напишите "fix user auth token expiration"

**Хорошие примеры:**
```
feat: add payment methods to split creation
fix: resolve duplicate user registration issue
refactor: extract auth logic to separate service
docs: update API endpoints documentation
```

**Плохие примеры:**
```
update
fix
changes
wip
asdf
```

**Код перед PR:**
- Убедитесь, что код запускается локально
- Прогоните линтер
- Проверьте, что не коммитите лишнего (node_modules, .env, личные файлы)

**Описание PR:**
- Объясните **что** сделано
- Объясните **зачем** это нужно
- Укажите **как проверить** изменения
- Выделите моменты, которые вызывают вопросы

---

## Частые проблемы

### Конфликты при rebase/merge

```bash
# git показывает конфликты в файлах
# открываем файл, видим:
<<<<<<< HEAD
старый код из main
=======
ваш код из ветки
>>>>>>> feat/payment-methods

# выбираем что оставить, удаляем маркеры конфликтов
# сохраняем файл

# добавляем разрешённый конфликт
git add путь/к/файлу

# продолжаем rebase
git rebase --continue

# если что-то пошло не так, можно отменить rebase
# git rebase --abort
```

### Случайно закоммитили в main

```bash
# если ещё не запушили
git reset HEAD~1  # откатываем последний коммит

# создаём правильную ветку
git checkout -b feat/my-feature

# коммитим заново
git add .
git commit -m "feat: правильный коммит в ветке"
```

### Забыли подтянуть изменения перед началом работы

```bash
# у вас уже есть коммиты в ветке
# нужно интегрировать изменения из main

git fetch origin main
git rebase origin/main

# или через merge
git merge origin/main
```

### Нужно изменить последний коммит

```bash
# если ещё не запушили
git add .
git commit --amend -m "новое сообщение коммита"

# если уже запушили, но никто не успел взять вашу ветку
git push origin feat/my-feature --force-with-lease
```

**Важно:** `--force-with-lease` безопаснее чем `--force`, но всё равно используйте осторожно.

---

## Полезные команды

```bash
# посмотреть статус изменений
git status

# посмотреть что изменилось в файлах
git diff

# посмотреть историю коммитов
git log --oneline --graph --all

# посмотреть все ветки
git branch -a

# удалить все старые локальные ветки которых уже нет на сервере
git fetch --prune
git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D

# посмотреть кто когда менял строки в файле
git blame путь/к/файлу

# временно спрятать изменения (чтобы переключить ветку)
git stash
# вернуть спрятанное
git stash pop

# создать и сразу переключиться на ветку
git checkout -b feat/new-feature
# или современный синтаксис
git switch -c feat/new-feature
```
