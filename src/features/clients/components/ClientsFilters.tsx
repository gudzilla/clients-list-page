import { useState, useEffect, useRef } from 'react';
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
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useParentClientOptions } from '../services/clientsApi';
import { useRegions } from '../services/regionsApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { type ClientsFilters, type PartyType, PARTY_TYPES } from '../types';

interface Props {
  filters: ClientsFilters;
  onFiltersChange: (filters: Partial<ClientsFilters>) => void;
  onReset: () => void;
}

const PARTY_TYPE_OPTIONS = [
  { value: '', label: 'Все' },
  { value: PARTY_TYPES.INDIVIDUAL, label: 'Физическое лицо' },
  { value: PARTY_TYPES.LEGAL, label: 'Юридическое лицо' },
];

export function ClientsFilters({ filters, onFiltersChange, onReset }: Props) {
  const {
    refetch: fetchParentOptions,
    data: clientOptions = [],
    isFetching,
  } = useParentClientOptions();

  const { data: regions = [] } = useRegions();

  const [localQuery, setLocalQuery] = useState(filters.query || '');
  const [prevFiltersQuery, setPrevFiltersQuery] = useState(filters.query);
  const debouncedQuery = useDebounce(localQuery, 500);
  const filtersQueryRef = useRef(filters.query);

  if (filters.query !== prevFiltersQuery) {
    setPrevFiltersQuery(filters.query);
    setLocalQuery(filters.query || '');
  }

  useEffect(() => {
    filtersQueryRef.current = filters.query;
  }, [filters.query]);

  useEffect(() => {
    if (debouncedQuery !== (filtersQueryRef.current || '')) {
      onFiltersChange({ query: debouncedQuery });
    }
  }, [debouncedQuery, onFiltersChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFiltersChange({ query: localQuery });
    }
  };

  const handleReset = () => {
    onReset();
  };

  const handleOpenParentSelect = () => {
    fetchParentOptions();
  };

  const selectedRegion = regions.find((r) => r.id === filters.regionId) || null;

  const selectedParent =
    clientOptions.find((c) => c.clientId === filters.parentId) || null;

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
            endAdornment: localQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  onClick={() => setLocalQuery('')}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ flex: '0 0 250px' }}
      />

      <Autocomplete
        size="small"
        options={isFetching ? [] : clientOptions}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) =>
          option.clientId === value.clientId
        }
        value={selectedParent}
        onChange={(_, value) => {
          onFiltersChange({
            parentId: value?.clientId,
          });
        }}
        onOpen={handleOpenParentSelect}
        loading={isFetching}
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
            regionId: value?.id,
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
              partyType: (e.target.value as PartyType) || undefined,
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
