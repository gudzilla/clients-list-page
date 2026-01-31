import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useClientSelectOptions } from '../services/clientsApi';
import { useRegions } from '../services/regionsApi';
import type { ClientsFilters as FiltersType, PartyType } from '../types';

interface Props {
  filters: FiltersType;
  onFiltersChange: (filters: FiltersType) => void;
}

const PARTY_TYPE_OPTIONS = [
  { value: '', label: 'Все' },
  { value: 'individual', label: 'Физическое лицо' },
  { value: 'legal', label: 'Юридическое лицо' },
];

export function ClientsFilters({ filters, onFiltersChange }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [prevFiltersQuery, setPrevFiltersQuery] = useState(filters.query);

  // Синхронизируем локальный state при внешнем сбросе фильтров
  if (filters.query !== prevFiltersQuery) {
    setPrevFiltersQuery(filters.query);
    setSearchQuery(filters.query || '');
  }

  const { data: clientOptions = [], refetch: refetchClients } = useClientSelectOptions();
  const { data: regions = [] } = useRegions();

  const handleSearch = () => {
    onFiltersChange({ ...filters, query: searchQuery, offset: 0 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    onFiltersChange({
      limit: filters.limit,
      offset: 0,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  const selectedParent = clientOptions.find((c) => c.clientId === filters.parentId) || null;
  const selectedRegion = regions.find((r) => r.id === filters.regionId) || null;

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      <TextField
        size="small"
        placeholder="Поиск по названию..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        sx={{ minWidth: 200 }}
      />
      <Button
        variant="contained"
        startIcon={<SearchIcon />}
        onClick={handleSearch}
      >
        Искать
      </Button>

      <Autocomplete
        size="small"
        options={clientOptions}
        getOptionLabel={(option) => option.name}
        value={selectedParent}
        onChange={(_, value) => {
          onFiltersChange({
            ...filters,
            parentId: value?.clientId,
            offset: 0,
          });
        }}
        onOpen={() => refetchClients()}
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
