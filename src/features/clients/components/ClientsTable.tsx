import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import { IconButton, Box, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Client, ClientsFilters } from '../types';

interface Props {
  clients: Client[];
  total: number;
  loading: boolean;
  filters: ClientsFilters;
  onFiltersChange: (filters: ClientsFilters) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({
  clients,
  total,
  loading,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: Props) {
  const columns: GridColDef<Client>[] = [
    {
      field: 'name',
      headerName: 'Название',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'fullName',
      headerName: 'Полное название',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'partyType',
      headerName: 'Тип',
      width: 130,
      renderCell: ({ value }) => (
        <Chip
          size="small"
          label={value === 'legal' ? 'Юр. лицо' : 'Физ. лицо'}
          color={value === 'legal' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      ),
    },
    {
      field: 'inn',
      headerName: 'ИНН',
      width: 130,
    },
    {
      field: 'createdAt',
      headerName: 'Создан',
      width: 120,
      valueFormatter: (value: string) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString('ru-RU');
      },
    },
    {
      field: 'actions',
      headerName: 'Действия',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <IconButton size="small" onClick={() => onEdit(row)} color="primary">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => onDelete(row)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      onFiltersChange({
        ...filters,
        sortBy: model[0].field,
        sortOrder: model[0].sort || 'asc',
      });
    } else {
      onFiltersChange({
        ...filters,
        sortBy: undefined,
        sortOrder: undefined,
      });
    }
  };

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    onFiltersChange({
      ...filters,
      limit: model.pageSize,
      offset: model.page * model.pageSize,
    });
  };

  const paginationModel = {
    page: Math.floor((filters.offset || 0) / (filters.limit || 10)),
    pageSize: filters.limit || 10,
  };

  const sortModel: GridSortModel = filters.sortBy
    ? [{ field: filters.sortBy, sort: filters.sortOrder || 'asc' }]
    : [];

  return (
    <DataGrid
      rows={clients}
      columns={columns}
      loading={loading}
      rowCount={total}
      paginationMode="server"
      sortingMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={handlePaginationModelChange}
      sortModel={sortModel}
      onSortModelChange={handleSortModelChange}
      pageSizeOptions={[5, 10, 25]}
      disableRowSelectionOnClick
      getRowId={(row) => row.clientId}
      autoHeight
      sx={{ minHeight: 400 }}
    />
  );
}
