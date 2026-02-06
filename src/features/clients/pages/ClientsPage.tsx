import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ClientsFilters } from '../components/ClientsFilters';
import { ClientsTable } from '../components/ClientsTable';
import { ClientFormModal } from '../components/ClientFormModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import {
  useClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
} from '../services/clientsApi';
import { useClientsFilters } from '../hooks/useClientsFilters';
import type { Client, CreateClient, BackendErrorResponse } from '../types';

/**
 * ГЛАВНАЯ СТРАНИЦА ФИЧИ
 * Роль компонента: Оркестрация. Он связывает URL-фильтры,
 * серверное состояние (Query/Mutations) и UI-компоненты.
 */
export function ClientsPage() {
  // 1. Состояние фильтров (синхронизировано с URL)
  const { filters, updateFilters, resetFilters } = useClientsFilters();

  // 2. Локальное UI-состояние (модалки, уведомления)
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 3. Серверное состояние
  // При изменении filters, useClients автоматически инициирует новый запрос.
  const { data, isFetching, error } = useClients(filters);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingClient(null);
  };

  const handleOpenDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingClient(null);
  };

  /**
   * Универсальный обработчик сохранения (создание или редактирование).
   * Передается в ClientFormModal как пропс onSubmit.
   */
  const handleSubmit = async (formData: CreateClient) => {
    if (editingClient) {
      /**
       * Используем mutateAsync вместо mutate, чтобы дождаться
       * завершения запроса на бэкенде. Это позволяет нам
       * показывать уведомление и закрывать модалку только ПОСЛЕ успешного ответа.
       */
      await updateMutation.mutateAsync({
        id: editingClient.clientId,
        data: formData,
      });
      setSnackbar({
        open: true,
        message: 'Клиент успешно обновлен',
        severity: 'success',
      });
    } else {
      // Аналогично: ждем создания клиента перед закрытием формы
      await createMutation.mutateAsync(formData);
      setSnackbar({
        open: true,
        message: 'Клиент успешно создан',
        severity: 'success',
      });
    }
    handleCloseForm();
  };

  /**
   * Обработка удаления.
   * [REFACTOR]: (Point 3) Логика catch здесь "тяжелая".
   * В идеале, обработка специфических ошибок (CLIENT_NOT_FOUND) должна быть
   * скрыта внутри хука useDeleteClient или сервиса, чтобы компонент просто вызывал метод.
   */
  const handleConfirmDelete = async () => {
    if (!deletingClient) return;

    try {
      await deleteMutation.mutateAsync(deletingClient.clientId);
      setSnackbar({
        open: true,
        message: 'Клиент успешно удален',
        severity: 'success',
      });
      handleCloseDelete();
    } catch (err: unknown) {
      const backendError = err as BackendErrorResponse;
      // Обработка кейса, когда кто-то другой уже удалил этого клиента
      if (
        backendError &&
        typeof backendError === 'object' &&
        'errorName' in backendError &&
        backendError.errorName === 'CLIENT_NOT_FOUND'
      ) {
        setSnackbar({
          open: true,
          message: 'Клиент уже был удален',
          severity: 'info',
        });
        handleCloseDelete();

        return;
      }
      const message = backendError?.message || 'Ошибка удаления клиента';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Клиенты
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Добавить клиента
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка загрузки данных
        </Alert>
      )}

      {/* Передаем функции обновления URL-фильтров */}
      <ClientsFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
      />

      <ClientsTable
        clients={data?.items || []}
        total={data?.total || 0}
        loading={isFetching}
        filters={filters}
        onFiltersChange={updateFilters}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Модалка формы. Мы передаем editingClient для режима редактирования */}
      <ClientFormModal
        open={formOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        client={editingClient}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        client={deletingClient}
        loading={deleteMutation.isPending}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Общий компонент уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
