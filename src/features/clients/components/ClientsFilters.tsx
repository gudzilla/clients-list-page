import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useClientSelectOptions } from '../services/clientsApi';
import { useRegions } from '../services/regionsApi';
import { useDebounce } from '../../../hooks/useDebounce';
import {
  type ClientsFilters as FiltersType,
  type PartyType,
  PARTY_TYPES,
} from '../types';

interface Props {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
  onReset: () => void;
}

const PARTY_TYPE_OPTIONS = [
  { value: '', label: 'Все' },
  { value: PARTY_TYPES.INDIVIDUAL, label: 'Физическое лицо' },
  { value: PARTY_TYPES.LEGAL, label: 'Юридическое лицо' },
];

export function ClientsFilters({ filters, onFiltersChange, onReset }: Props) {
  const {
    mutate: fetchParentOptions,
    data: clientOptions = [],
    isPending,
  } = useClientSelectOptions();
  const { data: regions = [] } = useRegions();

  // Локальный стейт для мновенного отображения ввода
  const [localQuery, setLocalQuery] = useState(filters.query || '');

  // Дебаунс значения (300мс)
  const debouncedQuery = useDebounce(localQuery, 500);

  // Синхронизация локального стейта при изменении фильтров извне (например, сброс)
  useEffect(() => {
    if (filters.query !== localQuery) {
      setLocalQuery(filters.query || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  // Эффект для обновления родительских фильтров при изменении дебаунс-значения
  useEffect(() => {
    // Обновляем только если значение отличается от текущего в фильтрах
    if (debouncedQuery !== (filters.query || '')) {
      onFiltersChange({ ...filters, query: debouncedQuery, offset: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Мгновенный поиск по Enter (игнорируя дебаунс)
      onFiltersChange({ ...filters, query: localQuery, offset: 0 });
    }
  };

  const handleReset = () => {
    onReset();
  };

  const handleOpenParentSelect = () => {
    fetchParentOptions();
  };

  const selectedParent =
    clientOptions.find((c) => c.clientId === filters.parentId) || null;
  const selectedRegion = regions.find((r) => r.id === filters.regionId) || null;

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <TextField
        size="small"
        placeholder="Поиск по названию..."
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ minWidth: 250 }}
      />

      <Autocomplete
        size="small"
        options={isPending ? [] : clientOptions}
        getOptionLabel={(option) => option.name}
        value={selectedParent}
        onChange={(_, value) => {
          onFiltersChange({
            ...filters,
            parentId: value?.clientId,
            offset: 0,
          });
        }}
        onOpen={handleOpenParentSelect}
        renderInput={(params) => (
          <TextField {...params} label="Родительский клиент" />
        )}
        sx={{ minWidth: 250 }}
      />

      <Autocomplete
        size="small"
        options={regions}
        getOptionLabel={(option) => option.name}
        value={selectedRegion}
        onChange={(_, value) => {
          onFiltersChange({
            ...filters,
            regionId: value?.id,
            offset: 0,
          });
        }}
        renderInput={(params) => <TextField {...params} label="Регион" />}
        sx={{ minWidth: 200 }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Тип стороны</InputLabel>
        <Select
          value={filters.partyType || ''}
          label="Тип стороны"
          onChange={(e) => {
            onFiltersChange({
              ...filters,
              partyType: (e.target.value as PartyType) || undefined,
              offset: 0,
            });
          }}
        >
          {PARTY_TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="outlined"
        startIcon={<ClearIcon />}
        onClick={handleReset}
      >
        Сбросить
      </Button>
    </Box>
  );
}
