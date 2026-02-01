# Server API Documentation

Этот документ описывает HTTP API бэкенда для интеграции с фронтендом.
API построено на REST-принципах.

## Общие сведения

*   **Base URL:** `http://localhost:8000`
*   **Формат обмена:** JSON (Content-Type: `application/json`)
*   **Кодировка:** UTF-8
*   **Типы данных:**
    *   **UUID:** Строка формата UUID (например, `3fa85f64-5717-4562-b3fc-2c963f66afa6`)
    *   **Date/Time:** ISO 8601 строка (например, `2023-10-27T10:00:00`)
    *   **Enum:** Строковые константы в `camelCase` (например, `individual`, `legal`)
*   **Именование полей:** `camelCase` во всех JSON-объектах.

## Сводная таблица API

| Метод | Эндпоинт | Описание |
| :--- | :--- | :--- |
| `GET` | `/api/clients` | Получение списка клиентов (фильтры, пагинация, сорт.) |
| `POST` | `/api/clients` | Создание нового клиента |
| `GET` | `/api/clients/{id}` | Получение данных одного клиента |
| `PATCH` | `/api/clients/{id}` | Редактирование клиента |
| `DELETE` | `/api/clients/{id}` | Удаление клиента |
| `GET` | `/api/regions` | Справочник регионов |

---

## 1. Клиенты (Clients)

Основной ресурс приложения.

### 1.1 Получение списка клиентов

Используется для отображения таблицы клиентов и для поиска в селекте "Родительский клиент".

**Endpoint:** `GET /api/clients`

**Query Parameters (Фильтрация, Пагинация, Сортировка):**

| Параметр | Тип | Описание | Пример |
| :--- | :--- | :--- | :--- |
| `query` | `string` | Поиск по частичному совпадению (Name, Full Name, INN). Регистронезависимый. | `?query=газпром` |
| `regionId` | `UUID` | Фильтр по точному совпадению ID региона. | `?regionId=...` |
| `parentId` | `UUID` | Фильтр по родительскому клиенту. | `?parentId=...` |
| `partyType` | `string` | Фильтр по типу контрагента (`individual`, `legal`). | `?partyType=legal` |
| `limit` | `int` | Количество записей на страницу (Default: 20, Max: 100). | `?limit=50` |
| `offset` | `int` | Смещение для пагинации (Default: 0). | `?offset=0` |
| `sortBy` | `string` | Поле сортировки. Допустимые значения: `name`, `createdAt`, `updatedAt`. Default: `createdAt`. | `?sortBy=name` |
| `sortOrder` | `string` | Направление сортировки. Допустимые значения: `asc` (возрастание), `desc` (убывание). Default: `desc`. | `?sortOrder=asc` |

**Response (200 OK):**

```json
{
  "items": [
    {
      "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Иванов И.И.",
      "fullName": "Иванов Иван Иванович",
      "partyType": "individual", // или "legal"
      "inn": "123456789012",
      "createdAt": "2023-10-27T12:00:00",
      "updatedAt": "2023-10-27T12:00:00",
      "regionId": "uuid-of-region-orb-null",
      "parentId": "uuid-of-parent-or-null"
    }
  ],
  "total": 150 // Общее количество записей, удовлетворяющих фильтрам (для пагинации)
}
```

### 1.2 Получение одного клиента

Используется для получения полных данных клиента перед открытием формы редактирования.

**Endpoint:** `GET /api/clients/{client_id}`

**Path Parameters:**
*   `client_id` (UUID): Уникальный идентификатор клиента.

**Response (200 OK):**

```json
{
  "clientId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "ООО Ромашка",
  "fullName": "Общество с ограниченной ответственностью Ромашка",
  "partyType": "legal",
  "inn": "7701234567",
  "createdAt": "2023-10-27T12:00:00",
  "updatedAt": "2023-10-27T12:00:00",
  "regionId": "uuid-region",
  "parentId": null
}
```

**Errors:**
*   `404 Not Found`: Клиент с таким ID не существует.

### 1.3 Создание клиента

**Endpoint:** `POST /api/clients`

**Request Body (JSON):**

| Поле | Тип | Обязательность | Ограничения | Описание |
| :--- | :--- | :--- | :--- | :--- |
| `name` | `string` | **Да** | Max 255 | Краткое наименование |
| `partyType` | `string` | **Да** | `individual` \| `legal` | Тип стороны |
| `fullName` | `string` | Нет | Max 512 | Полное наименование |
| `inn` | `string` | Нет | Max 12 | ИНН |
| `regionId` | `UUID` | Нет | | ID региона из справочника |
| `parentId` | `UUID` | Нет | | ID существующего родительского клиента |

**Пример Body:**
```json
{
  "name": "Новый Клиент",
  "partyType": "legal",
  "inn": "1234567890",
  "regionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Response (201 Created):**
Возвращает созданный объект клиента (структура аналогична `GET /api/clients/{id}`).

**Errors:**
*   `409 Conflict`:
    *   `errorName: "CLIENT_ALREADY_EXISTS"` — Клиент с таким `name` уже существует.
    *   `errorName: "CLIENT_ALREADY_EXISTS_BY_INN"` — Клиент с таким `inn` уже существует.
*   `422 Unprocessable Entity`: Ошибка валидации полей (например, пустой name, длинный ИНН).
*   `404 Not Found`:
    *   `errorName: "PARENT_CLIENT_NOT_FOUND"` — Указанный `parentId` не существует.

### 1.4 Редактирование клиента

**Endpoint:** `PATCH /api/clients/{client_id}`

**Path Parameters:**
*   `client_id` (UUID): ID редактируемого клиента.

**Request Body (JSON):**
Любое подмножество полей из метода создания (`name`, `fullName`, `partyType`, `inn`, `regionId`, `parentId`). Все поля опциональны. Передавайте только то, что изменилось.

**Пример Body:**
```json
{
  "name": "Измененное Имя",
  "regionId": null // Сбросить регион
}
```

**Response (200 OK):**
Возвращает обновленный объект клиента.

**Errors:**
*   `404 Not Found`: Клиент не найден.
*   `409 Conflict`: Нарушение уникальности (Name или INN заняты другим клиентом).

### 1.5 Удаление клиента

**Endpoint:** `DELETE /api/clients/{client_id}`

**Response (204 No Content):**
Успешное удаление, тело ответа пустое.

**Errors:**
*   `404 Not Found`: Клиент не найден.

---

## 2. Регионы (Regions)

Справочник регионов. Данные считаются условно-постоянными, рекомендуется кеширование на клиенте.

### 2.1 Получение списка регионов

**Endpoint:** `GET /api/regions`

**Query Parameters:** Нет.

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Москва"
    },
    {
      "id": "4ab85f64-5717-4562-b3fc-2c963f66afa7",
      "name": "Санкт-Петербург"
    }
    // ...
  ]
}
```

---

## 3. Обработка ошибок

В случае ошибки API возвращает статус код 4xx или 5xx и JSON-тело стандартизированного формата.

**Структура ошибки:**

```json
{
  "errorName": "STRING_CODE", // Уникальный строковый код ошибки
  "message": "Читаемое сообщение об ошибке",
  "errors": [ // Опционально: детализация по полям (при валидации)
    {
      "field": "body.inn",
      "message": "String should have at most 12 characters"
    }
  ]
}
```

**Основные коды ошибок (`errorName`):**

| Код | HTTP Status | Описание |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 422 | Ошибка валидации входных данных (тип, длина, обязательность). |
| `CLIENT_NOT_FOUND` | 404 | Клиент с указанным ID не найден. |
| `PARENT_CLIENT_NOT_FOUND` | 404 | Попытка привязать к несуществующему родителю. |
| `CLIENT_ALREADY_EXISTS` | 409 | Клиент с таким Именем уже существует. |
| `CLIENT_ALREADY_EXISTS_BY_INN` | 409 | Клиент с таким ИНН уже существует. |

---

## 4. Сценарии интеграции (Frontend Cheatsheet)

### Фильтры в списке клиентов
1.  **Текстовый поиск:** Input text -> debounce -> `query` parameter.
2.  **Регион:**
    *   При загрузке приложения: `GET /api/regions`.
    *   Select option `value` = `region.id`.
    *   При выборе -> `regionId` parameter.
3.  **Родительский клиент:**
    *   Async Select.
    *   При вводе текста -> `GET /api/clients?query={input}&limit=20`.
    *   При выборе -> `parentId` parameter.
4.  **Тип стороны:**
    *   Static Select.
    *   Options:
        *   `{ value: "individual", label: "Физ. лицо" }`
        *   `{ value: "legal", label: "Юр. лицо" }`
    *   При выборе -> `partyType` parameter.

### Формы (Create / Edit)
*   **Create:** `POST /api/clients`. При успехе — закрыть модалку, обновить таблицу (или добавить строку).
*   **Edit:**
    1.  Получить полные данные: `GET /api/clients/{id}` (или использовать данные из строки таблицы, если там есть всё необходимое).
    2.  `PATCH /api/clients/{id}` с измененными полями.
    3.  При успехе — закрыть модалку, обновить строку в таблице.
*   **Обработка ошибок:**
    *   Если `422 VALIDATION_ERROR` -> подсветить поля формы, используя массив `errors` (поле `field` указывает путь, напр. `body.inn`).
    *   Если `409 CLIENT_ALREADY_EXISTS` -> показать глобальный алерт или ошибку у поля "Название".
