# Clients Management

Frontend-приложение для управления клиентами.

## Стек

- **Vite** + **React** + **TypeScript**
- **MUI** (Material UI) - компоненты UI
- **TanStack Query** - кэширование и синхронизация данных
- **React Hook Form** + **Zod** - формы и валидация

## Установка и запуск

```bash
npm install
npm run dev
```

Приложение будет доступно на http://localhost:5173

## Структура проекта

```
src/
  features/clients/
    components/
      ClientsTable.tsx        # MUI DataGrid с пагинацией и сортировкой
      ClientsFilters.tsx      # поиск + селекты фильтров
      ClientFormModal.tsx     # создание/редактирование клиента
      DeleteConfirmDialog.tsx # подтверждение удаления
    pages/
      ClientsPage.tsx         # главная страница
    services/
      clientsApi.ts           # TanStack Query хуки для клиентов
      regionsApi.ts           # хук для регионов
    types/
      index.ts                # TypeScript типы
```

## API эндпоинты

| Метод  | URL                         | Описание                    |
| ------ | --------------------------- | --------------------------- |
| GET    | /api/clients                | Список клиентов с фильтрами |
| GET    | /api/clients/:id            | Один клиент                 |
| POST   | /api/clients                | Создать клиента             |
| PUT    | /api/clients/:id            | Обновить клиента            |
| DELETE | /api/clients/:id            | Удалить клиента             |
| GET    | /api/clients/select-options | Список для селекта          |
| GET    | /api/regions                | Справочник регионов         |

## Функциональность

- Просмотр списка клиентов с server-side пагинацией и сортировкой
- Фильтрация по: поисковому запросу, родительскому клиенту, региону, типу стороны
- Создание нового клиента
- Редактирование существующего клиента
- Удаление клиента с подтверждением
- Валидация ИНН (10 или 12 цифр)

## Технический Стек

- **MUI X Data Grid** — высокопроизводительная таблица с поддержкой виртуализации, фильтрации и сортировки «из коробки» для эффективной работы с большими массивами данных.
-
