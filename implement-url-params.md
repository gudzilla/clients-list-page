### Инструкция для агента: переход на URL-параметры без сторонних библиотек

Цель: **перенести фильтры/сортировку/пагинацию клиентов в URL-параметры с самописной реализацией**, без `nuqs` и других библиотек. Это тестовое задание: важнее чистая демонстрация подхода, чем “железобетонный” продакшн.

---

### 1. Базовые принципы

1. **Single Source of Truth = URL**
   - Все “значимые” фильтры (`query`, `parentId`, `regionId`, `partyType`, `limit`, `offset`, `sortBy`, `sortOrder`) берутся из URL (`window.location.search`) и туда же пишутся.
   - Не держать для них дополнительный глобальный `useState` (вроде текущего `useFilters`), кроме временного UI-стейта.

2. **Разделение типов стейта**
   - **URL state**: фильтры, сортировка, пагинация.
   - **Server state**: данные клиентов (`useClients(filters)` и прочие React Query хуки).
   - **UI state**: модалки, выбранный клиент, snackbar, временный ввод (например, `localQuery` с debounce).
   - Локальные `useState` допустимы только в UI-слое, **не** для фильтров.

3. **Один хук-слой над URL**
   - Ввести **один самописный хук** (условно `useClientsFiltersFromUrl`), который:
     - читает URL → собирает объект `ClientsFilters`,
     - предоставляет функции обновления, которые:
       - меняют URL (через `history.replaceState`),
       - провоцируют перерендер и новый вызов `useClients(filters)`.
   - Остальной код (`ClientsPage`, `ClientsFilters`, `ClientsTable`) не знает деталей `URLSearchParams`, работает только с `ClientsFilters` + коллбэками.

---

### 2. Механика работы с URL (самописно)

1. **Чтение фильтров из URL**
   - Использовать `new URLSearchParams(window.location.search)` (SPA на Vite, без сложного роутинга).
   - Реализовать функцию уровня “утилита”:
     - `parseClientsFiltersFromSearch(search: string): ClientsFilters`
     - Внутри:
       - читать значения по ключам,
       - приводить типы (числа, строки, enum),
       - подставлять дефолты (`limit=10`, `offset=0`, `sortBy=createdAt`, `sortOrder=desc`),
       - игнорировать мусор/невалидные значения (например, `Number(...) || default`).

2. **Запись фильтров в URL**
   - Реализовать функцию:
     - `buildSearchFromClientsFilters(filters: ClientsFilters): string`
   - Правила:
     - не писать лишние/пустые параметры (например, отсутствующий `partyType` не попадает в URL),
     - для значений, равных дефолтам, параметры можно опускать (опционально, для красоты URL),
     - использовать `URLSearchParams` для сборки query-строки.
   - Обновление URL:
     - `window.history.replaceState(null, '', pathname + search)` — чтобы не засорять историю при каждой мелкой правке фильтра.

3. **Реакция на изменения**
   - Базовый подход:
     - `useClientsFiltersFromUrl` при каждом рендере дергает `parseClientsFiltersFromSearch(window.location.search)` и возвращает объект `filters`.
   - Для обновления фильтра:
     - экспортировать функцию/коллбек `updateFilters(partial: Partial<ClientsFilters>)`, которая:
       - берет текущие `filters` (из хука),
       - смешивает с `partial`,
       - делает новый `search` через `buildSearchFromClientsFilters`,
       - вызывает `history.replaceState`.
   - Важно: **фильтры не хранятся в `useState`** — они вычисляются из URL. Можно использовать `useMemo` для оптимизации, но не новый источник истины.

---

### 3. Что делать в конкретных компонентах

1. **`ClientsPage`**
   - Задача:
     - заменить использование текущего `useFilters` на `useClientsFiltersFromUrl`.
   - Ожидаемый контракт:
     - `const { filters, updateFilters, resetFilters } = useClientsFiltersFromUrl();`
   - Передавать:
     - в `useClients(filters)`,
     - в `ClientsFilters`,
     - в `ClientsTable`.

2. **`ClientsFilters`**
   - Работает с пропсами:
     - `filters: ClientsFilters`,
     - `onFiltersChange: (filters: ClientsFilters) => void`,
     - `onReset: () => void`.
   - Допустимо оставить:
     - локальный `localQuery` + `useDebounce`, чтобы не спамить URL.
   - При применении фильтра:
     - вызывать `onFiltersChange` с новым объектом (агент решит, вызывать ли `updateFilters` с partial или полный объект).

3. **`ClientsTable`**
   - Использует:
     - `filters.limit`, `filters.offset`, `filters.sortBy`, `filters.sortOrder`.
   - При изменении страницы/сортировки:
     - вызывает `onFiltersChange`/`updateFilters`, которые меняют URL.
   - Никакого `useState` для текущей страницы/сортировки — всё в URL.

4. **`useFilters`**
   - Как минимум:
     - либо удалить/переписать, чтобы он стал простым прокси к URL-реализации,
     - либо оставить только как тонкую обертку над `useClientsFiltersFromUrl` (без своего `useState`).

---

### 4. Допустимые упрощения (это тестовое, не продакшн)

1. **Валидность входящих параметров**
   - Можно не покрывать все крайние кейсы:
     - достаточно базовой “мягкой” валидации (`Number(...) || default`, проверка на допустимые значения enum).
2. **История навигации**
   - Можно всегда использовать `replaceState`, чтобы избежать “шума” в Back-button.
   - Не нужно реализовывать сложную стратегию `push` vs `replace`.
3. **Отсутствие роутера**
   - Можно работать напрямую с `window.location` и `history`, не тащить `react-router`.

---

### 5. Как агенту строить план

1. **Изучить текущие файлы**
   - `ClientsPage.tsx`, `ClientsFilters.tsx`, `ClientsTable.tsx`, `useFilters.ts`, `clientsApi.ts`, `types/index.ts`.
   - Выявить все места, где сейчас:
     - фильтры хранятся в `useState`,
     - фильтры передаются в запросы и компоненты.

2. **Спроектировать хук `useClientsFiltersFromUrl`**
   - Описать:
     - сигнатуру (что возвращает),
     - какие параметры поддерживает,
     - как обрабатываются дефолты.
   - Реализовать утилиты `parseFromSearch` и `buildSearchFromFilters`.

3. **Пошаговый рефакторинг**
   - Заменить `useFilters` в `ClientsPage` → `useClientsFiltersFromUrl`.
   - Подчистить `ClientsFilters`/`ClientsTable`, чтобы они:
     - не заводили лишний глобальный стейт фильтров,
     - прокидывали изменения вверх через коллбеки.
   - Убедиться, что:
     - URL меняется при изменении фильтров,
     - при прямом вводе URL-параметров состояние корректно восстанавливается.

4. **Сделать решение простым и читаемым**
   - Не строить универсальный фреймворк.
   - Цель — показать:
     - явную работу с URL,
     - ясное разделение стейтов,
     - отсутствие дублирования.
