import { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Autocomplete,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useClientSelectOptions } from '../services/clientsApi';
import { useRegions } from '../services/regionsApi';
import type { Client, CreateClientDto, PartyType } from '../types';

const schema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  fullName: z.string().optional(),
  partyType: z.enum(['INDIVIDUAL', 'LEGAL'], {
    message: 'Выберите тип стороны',
  }),
  inn: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^(\d{10}|\d{12})$/.test(val),
      'ИНН должен содержать 10 или 12 цифр'
    ),
  parentClientId: z.string().optional(),
  regionId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientDto) => void;
  client?: Client | null;
  loading?: boolean;
}

export function ClientFormModal({ open, onClose, onSubmit, client, loading }: Props) {
  const { data: clientOptions = [], refetch: refetchClients } = useClientSelectOptions();
  const { data: regions = [] } = useRegions();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      fullName: '',
      partyType: 'LEGAL' as PartyType,
      inn: '',
      parentClientId: '',
      regionId: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          fullName: client.fullName || '',
          partyType: client.partyType,
          inn: client.inn || '',
          parentClientId: client.parentClientId || '',
          regionId: client.regionId || '',
        });
      } else {
        reset({
          name: '',
          fullName: '',
          partyType: 'LEGAL',
          inn: '',
          parentClientId: '',
          regionId: '',
        });
      }
    }
  }, [open, client, reset]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      name: data.name,
      fullName: data.fullName || undefined,
      partyType: data.partyType,
      inn: data.inn || undefined,
      parentClientId: data.parentClientId || undefined,
      regionId: data.regionId || undefined,
    });
  };

  // Фильтруем опции родителя (исключаем текущего клиента)
  const filteredClientOptions = client
    ? clientOptions.filter((c) => c.id !== client.id)
    : clientOptions;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          {client ? 'Редактирование клиента' : 'Новый клиент'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Название *"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Полное название"
                  fullWidth
                />
              )}
            />

            <Controller
              name="partyType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.partyType}>
                  <InputLabel>Тип стороны *</InputLabel>
                  <Select {...field} label="Тип стороны *">
                    <MenuItem value="LEGAL">Юридическое лицо</MenuItem>
                    <MenuItem value="INDIVIDUAL">Физическое лицо</MenuItem>
                  </Select>
                  {errors.partyType && (
                    <FormHelperText>{errors.partyType.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="inn"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="ИНН"
                  error={!!errors.inn}
                  helperText={errors.inn?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="parentClientId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={filteredClientOptions}
                  getOptionLabel={(option) => option.name}
                  value={filteredClientOptions.find((c) => c.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  onOpen={() => refetchClients()}
                  renderInput={(params) => (
                    <TextField {...params} label="Родительский клиент" />
                  )}
                />
              )}
            />

            <Controller
              name="regionId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={regions}
                  getOptionLabel={(option) => option.name}
                  value={regions.find((r) => r.id === field.value) || null}
                  onChange={(_, value) => field.onChange(value?.id || '')}
                  renderInput={(params) => (
                    <TextField {...params} label="Регион" />
                  )}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {client ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
