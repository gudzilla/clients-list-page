import { useState } from 'react';
import { Container, Typography, Button, Box, Alert, Snackbar } from '@mui/material';
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
import type { Client, ClientsFilters as FiltersType, CreateClientDto } from '../types';

export function ClientsPage() {
  const [filters, setFilters] = useState<FiltersType>({
    limit: 10,
    offset: 0,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading, error } = useClients(filters);
  const createMutation = useCreateClient(filters);
  const updateMutation = useUpdateClient(filters);
  const deleteMutation = useDeleteClient(filters);

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

  const handleSubmit = async (formData: CreateClientDto) => {
    try {
      if (editingClient) {
        await updateMutation.mutateAsync({ id: editingClient.clientId, data: formData });
        setSnackbar({ open: true, message: 'Клиент успешно обновлен', severity: 'success' });
      } else {
        await createMutation.mutateAsync(formData);
        setSnackbar({ open: true, message: 'Клиент успешно создан', severity: 'success' });
      }
      handleCloseForm();
    } catch {
      setSnackbar({ open: true, message: 'Произошла ошибка', severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingClient) return;

    try {
      await deleteMutation.mutateAsync(deletingClient.clientId);
      setSnackbar({ open: true, message: 'Клиент успешно удален', severity: 'success' });
      handleCloseDelete();
    } catch {
      setSnackbar({ open: true, message: 'Ошибка удаления клиента', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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

      <ClientsFilters filters={filters} onFiltersChange={setFilters} />

      <ClientsTable
        clients={data?.items || []}
        total={data?.total || 0}
        loading={isLoading}
        filters={filters}
        onFiltersChange={setFilters}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
