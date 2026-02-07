import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  // TableSortLabel,
  IconButton,
  Chip,
  LinearProgress,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { type Client, type ClientsFilters, PARTY_TYPES } from '../types';

interface Props {
  clients: Client[];
  total: number;
  loading: boolean;
  filters: ClientsFilters;
  onFiltersChange: (filters: Partial<ClientsFilters>) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

// [TABLE SORTING]: Список полей, по которым бэкенд умеет сортировать.
// type SortableField = 'name' | 'fullName' | 'inn' | 'createdAt';

const DEFAULT_PAGE_SIZE = 20;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function ClientsTable({
  clients,
  total,
  loading,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
}: Props) {
  const pageSize = filters.pageSize || DEFAULT_PAGE_SIZE;
  const MUITablePage = (filters.page || 1) - 1;

  /**
   * [TABLE SORTING]: Логика переключения направления сортировки.
   * Без неё компонент становится чище, но мы теряем возможность
   * управлять порядком вывода данных с бэкенда.
   */
  /*
  const handleRequestSort = (property: SortableField) => {
    const isAsc = filters.sortBy === property && filters.sortOrder === 'asc';
    onFiltersChange({
       
      sortBy: property,
      sortOrder: isAsc ? 'desc' : 'asc',
    });
  };
  */

  const handleChangePage = (_: unknown, newPage: number) => {
    onFiltersChange({
      page: newPage + 1,
    });
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newPageSize = parseInt(event.target.value, 10);
    onFiltersChange({
      pageSize: newPageSize,
      page: 1,
    });
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Линия загрузки под шапкой для индикации фонового обновления данных */}
      {loading && <LinearProgress />}

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              <TableCell>
                {/* [TABLE SORTING]: Без TableSortLabel код становится декларативным, но статичным */}
                {/* 
                <TableSortLabel
                  active={filters.sortBy === 'name'}
                  direction={
                    filters.sortBy === 'name' ? filters.sortOrder : 'asc'
                  }
                  onClick={() => handleRequestSort('name')}
                >
                  Название
                </TableSortLabel>
                */}
                Название
              </TableCell>
              <TableCell>
                {/* 
                <TableSortLabel
                  active={filters.sortBy === 'fullName'}
                  direction={
                    filters.sortBy === 'fullName' ? filters.sortOrder : 'asc'
                  }
                  onClick={() => handleRequestSort('fullName')}
                >
                  Полное название
                </TableSortLabel>
                */}
                Полное название
              </TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>
                {/* 
                <TableSortLabel
                  active={filters.sortBy === 'inn'}
                  direction={
                    filters.sortBy === 'inn' ? filters.sortOrder : 'asc'
                  }
                  onClick={() => handleRequestSort('inn')}
                >
                  ИНН
                </TableSortLabel>
                */}
                ИНН
              </TableCell>
              <TableCell>
                {/* 
                <TableSortLabel
                  active={filters.sortBy === 'createdAt'}
                  direction={
                    filters.sortBy === 'createdAt' ? filters.sortOrder : 'asc'
                  }
                  onClick={() => handleRequestSort('createdAt')}
                >
                  Создан
                </TableSortLabel>
                */}
                Создан
              </TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    variant="body1"
                    sx={{ py: 3, color: 'text.secondary' }}
                  >
                    Нет данных
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.clientId} hover>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.fullName || '-'}</TableCell>
                  <TableCell>
                    {/* Визуальное разделение типов через Chip */}
                    <Chip
                      size="small"
                      label={
                        client.partyType === PARTY_TYPES.LEGAL
                          ? 'Юр. лицо'
                          : 'Физ. лицо'
                      }
                      color={
                        client.partyType === PARTY_TYPES.LEGAL
                          ? 'primary'
                          : 'secondary'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{client.inn || '-'}</TableCell>
                  <TableCell>
                    {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell align="right">
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => onEdit(client)}
                        color="primary"
                        title="Редактировать"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDelete(client)}
                        color="error"
                        title="Удалить"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Пагинация MUI, полностью контролируемая через пропсы */}
      <TablePagination
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        component="div"
        count={total}
        rowsPerPage={pageSize}
        page={MUITablePage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Строк на странице:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}–${to} из ${count}`
        }
      />
    </Paper>
  );
}
