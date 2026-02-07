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

/**
 * Варианты для статического селекта.
 * [MVP]: Описаны в коде, так как это константные бизнес-данные.
 */
const PARTY_TYPE_OPTIONS = [
  { value: '', label: 'Все' },
  { value: PARTY_TYPES.INDIVIDUAL, label: 'Физическое лицо' },
  { value: PARTY_TYPES.LEGAL, label: 'Юридическое лицо' },
];

export function ClientsFilters({ filters, onFiltersChange, onReset }: Props) {
  // Хук для динамического селекта (запрос при открытии)
  const {
    refetch: fetchParentOptions,
    data: clientOptions = [],
    isFetching,
  } = useParentClientOptions();

  // Хук для кэшируемого селекта (запрос 1 раз)
  const { data: regions = [] } = useRegions();

  /**
   * ЛОКАЛЬНОЕ СОСТОЯНИЕ ПОИСКА
   * Мы не меняем URL при каждом нажатии клавиши (это было бы слишком дорого для производительности).
   * Вместо этого мы храним текст в localQuery.
   */
  const [localQuery, setLocalQuery] = useState(filters.query || '');

  // Применяем дебаунс в 500мс
  const debouncedQuery = useDebounce(localQuery, 500);

  /**
   * Синхронизация: если URL изменился извне (например, нажали "Назад"),
   * мы обновляем локальное поле.
   */
  useEffect(() => {
    if (filters.query !== localQuery) {
      setLocalQuery(filters.query || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  /**
   * Применение поиска: когда дебаунс "отстрелял", мы обновляем фильтры в URL.
   */
  useEffect(() => {
    if (debouncedQuery !== (filters.query || '')) {
      onFiltersChange({ query: debouncedQuery });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onFiltersChange({ query: localQuery });
    }
  };

  const handleReset = () => {
    onReset();
  };

  /**
   * Реализация динамического селекта (Point "каждый раз"):
   * Вызываем fetch только в момент открытия выпадающего списка.
   */
  const handleOpenParentSelect = () => {
    fetchParentOptions();
  };

  const selectedRegion = regions.find((r) => r.id === filters.regionId) || null;

  const selectedParent =
    clientOptions.find((c) => c.clientId === filters.parentId) || null;

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
      {/* 1. Текстовый поиск с дебаунсом */}
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

      {/* 2. Динамический селект (Родительский клиент) */}
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

      {/* 3. Кэшируемый селект (Регион) */}
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

      {/* 4. Статичный селект (Тип стороны) */}
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
