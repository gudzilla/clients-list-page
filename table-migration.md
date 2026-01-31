# План миграции с MUI DataGrid на MUI Table

Цель: Заменить сложный компонент `DataGrid` на простую, предсказуемую связку `Table` + `TablePagination` для решения проблем с пагинацией и упрощения кода.

## 1. Функциональные требования (Feature Parity)

Новая таблица должна поддерживать весь функционал, который был в `DataGrid`:

1.  **Отображение данных:**
    *   **Название (`name`)**: Текст.
    *   **Полное название (`fullName`)**: Текст.
    *   **Тип (`partyType`)**:
        *   Отображается как `Chip` (Badge).
        *   `legal` -> "Юр. лицо" (primary color).
        *   `individual` -> "Физ. лицо" (secondary color).
    *   **ИНН (`inn`)**: Текст.
    *   **Создан (`createdAt`)**:
        *   Форматирование даты: `new Date(value).toLocaleDateString('ru-RU')`.
    *   **Действия (`actions`)**:
        *   Кнопка "Редактировать" (Icon: `Edit`).
        *   Кнопка "Удалить" (Icon: `Delete`).

2.  **Пагинация (Server-side):**
    *   Компонент: `TablePagination`.
    *   Параметры:
        *   `count`: Общее количество записей (`total`).
        *   `page`: Текущая страница (вычисляется как `offset / limit`).
        *   `rowsPerPage`: Размер страницы (`limit`).
        *   `rowsPerPageOptions`: `[5, 10, 25]`.
    *   События:
        *   `onPageChange`: Обновляет `offset` (`newPage * limit`).
        *   `onRowsPerPageChange`: Обновляет `limit` и сбрасывает `offset` в 0.

3.  **Сортировка (Server-side):**
    *   Компонент: `TableSortLabel` в заголовке колонок.
    *   Логика:
        *   Клик по заголовку переключает `sortOrder` (asc/desc) и устанавливает `sortBy`.
        *   Активное состояние подсвечивается.
    *   Сортируемые поля: `name`, `fullName`, `inn`, `createdAt` (в DataGrid по умолчанию все сортируемые, но проверим, какие реально нужны. Обычно Name, Date точно нужны).

4.  **Состояние загрузки:**
    *   Отображение `LinearProgress` или `CircularProgress` поверх таблицы (или внутри `TableBody`), когда `loading === true`.
    *   Опционально: прозрачность (opacity) для контента при загрузке.

5.  **Пустое состояние:**
    *   Если `clients.length === 0` и `!loading`, показать строку "Нет данных".

## 2. Техническая реализация

### Шаг 1: Подготовка нового компонента
Файл: `src/features/clients/components/ClientsTableSimple.tsx` (временное имя, потом заменим оригинальный).

**Используемые компоненты MUI:**
*   `TableContainer` (Paper)
*   `Table`
*   `TableHead`
*   `TableBody`
*   `TableRow`
*   `TableCell`
*   `TablePagination`
*   `TableSortLabel`
*   `Chip`
*   `IconButton`
*   `LinearProgress` (для лоадера)

### Шаг 2: Реализация рендера
```tsx
<TableContainer component={Paper}>
  {loading && <LinearProgress />}
  <Table>
    <TableHead>
      <TableRow>
        {/* Колонки с сортировкой */}
        <TableCell>
            <TableSortLabel
              active={filters.sortBy === 'name'}
              direction={filters.sortOrder || 'asc'}
              onClick={() => handleRequestSort('name')}
            >
              Название
            </TableSortLabel>
        </TableCell>
        {/* ... остальные колонки */}
      </TableRow>
    </TableHead>
    <TableBody>
       {/* Маппинг данных */}
       {clients.map(client => (
         <TableRow key={client.clientId}>
            <TableCell>{client.name}</TableCell>
            {/* ... */}
         </TableRow>
       ))}
    </TableBody>
  </Table>
  <TablePagination
     component="div"
     count={total}
     page={page}
     onPageChange={...}
     rowsPerPage={limit}
     onRowsPerPageChange={...}
  />
</TableContainer>
```

### Шаг 3: Интеграция
1.  Заменить импорт в `ClientsPage.tsx`: `ClientsTable` -> `ClientsTableSimple`.
2.  Проверить работу.
3.  Переименовать `ClientsTableSimple.tsx` в `ClientsTable.tsx` (удалить старый).

## 3. Обработка краевых случаев
*   **Смена `limit`:** При смене размера страницы, `offset` должен корректно пересчитаться (обычно сброс на 0 страницу — самое безопасное).
*   **Удаление последней записи на странице:** Если мы на 2-й странице, там 1 запись, и мы её удаляем -> нужно перейти на 1-ю страницу. Это должно обрабатываться внешней логикой (React Query invalidate), но таблица должна корректно отобразить пустой список или предыдущую страницу, если `total` обновится.

## 4. Зависимости
Убедиться, что все MUI компоненты импортированы корректно.
`@mui/material`: Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, TableSortLabel, IconButton, Chip, LinearProgress.
`@mui/icons-material`: Edit, Delete.
