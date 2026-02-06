import { useEffect, useState } from 'react';
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
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParentClientOptions, useClient } from '../services/clientsApi';
import { useRegions } from '../services/regionsApi';
import {
  type Client,
  type CreateClient,
  type BackendErrorResponse,
  PARTY_TYPES,
} from '../types';

/**
 * СХЕМА ВАЛИДАЦИИ (Zod)
 * Описываем правила прямо в компоненте для наглядности.
 * Преимущество: Типы для формы (FormData) выводятся автоматически из схемы.
 */
const schema = z.object({
  name: z.string().min(1, 'Введите название').max(255),
  fullName: z.string().max(255).optional(),
  partyType: z.enum([PARTY_TYPES.INDIVIDUAL, PARTY_TYPES.LEGAL], {
    message: 'Выберите тип стороны',
  }),
  inn: z
    .string()
    .refine(
      (val) => !val || val.length === 10 || val.length === 12,
      'ИНН должен содержать 10 или 12 цифр'
    )
    .optional(),
  parentId: z.uuid().optional().or(z.literal('')),
  regionId: z.uuid().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  // onSubmit приходит из ClientsPage и выполняет реальный запрос к API
  onSubmit: (data: CreateClient) => Promise<void>;
  client?: Client | null; // Если передан - режим редактирования
  loading?: boolean;
}

export function ClientFormModal({
  open,
  onClose,
  onSubmit,
  client,
  loading,
}: Props) {
  // Загрузка справочников
  const {
    refetch: fetchParentOptions,
    data: clientOptions = [],
    isFetching,
  } = useParentClientOptions();
  const { data: regions = [] } = useRegions();

  // Дозагружаем данные родителя, если мы в режиме редактирования и у клиента есть parentId
  const { data: initialParentClient } = useClient(client?.parentId || null);

  const [genericError, setGenericError] = useState<string | null>(null);

  /**
   * Стейт для отслеживания изменения состояния "открыто/закрыто".
   * Нужно для сброса ошибок при повторном открытии.
   */
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    if (open) {
      setGenericError(null);
    }
    setPrevOpen(open);
  }

  const {
    control,
    handleSubmit, // Это функция-обертка от RHF для валидации
    reset,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      fullName: '',
      partyType: PARTY_TYPES.INDIVIDUAL,
      inn: '',
      parentId: '',
      regionId: '',
    },
  });

  /**
   * ИНИЦИАЛИЗАЦИЯ ДАННЫХ (Point 2)
   * [LEGACY/MVP]: Синхронизируем стейт формы с пропсом `client`.
   * При открытии модалки (open: true) мы либо сбрасываем форму в дефолт,
   * либо заполняем данными существующего клиента.
   *
   * [REFACTOR]: (Point 4) Вместо этого useEffect лучше добавить `key={client?.clientId || 'new'}`
   * на компонент Dialog или форму. React сам уничтожит и создаст компонент
   * с новыми defaultValues при смене клиента, что уберет нужду в ручном reset().
   */
  useEffect(() => {
    if (open) {
      if (client) {
        reset({
          name: client.name,
          fullName: client.fullName || '',
          partyType: client.partyType,
          inn: client.inn || '',
          parentId: client.parentId || '',
          regionId: client.regionId || '',
        });
      } else {
        reset({
          name: '',
          fullName: '',
          partyType: PARTY_TYPES.INDIVIDUAL,
          inn: '',
          parentId: '',
          regionId: '',
        });
      }
    }
  }, [open, client, reset]);

  /**
   * ОБРАБОТЧИК ОТПРАВКИ (Point 5)
   * ВАЖНО: handleFormSubmit вызывается ТОЛЬКО если валидация Zod прошла успешно.
   * handleSubmit(handleFormSubmit) — это цепочка:
   * Проверка полей -> handleFormSubmit -> API запрос (через пропс onSubmit).
   */
  const handleFormSubmit = async (data: FormData) => {
    setGenericError(null);
    try {
      // Вызываем бизнес-логику сохранения, переданную сверху
      await onSubmit({
        name: data.name,
        fullName: data.fullName || null,
        partyType: data.partyType,
        inn: data.inn || null,
        parentId: data.parentId || null,
        regionId: data.regionId || null,
      });
    } catch (error: unknown) {
      const backendError = error as BackendErrorResponse;

      /**
       * ОТОБРАЖЕНИЕ ОШИБОК БЭКЕНДА (Point 3)
       * Мы мапим серверные ошибки на конкретные поля формы.
       * Например, если бэкенд сказал, что ИНН дублируется,
       * мы подсвечиваем поле ИНН красным через setError.
       */
      if (
        backendError &&
        typeof backendError === 'object' &&
        'errorName' in backendError
      ) {
        switch (backendError.errorName) {
          case 'CLIENT_ALREADY_EXISTS':
            setError('name', { message: backendError.message });
            break;
          case 'CLIENT_ALREADY_EXISTS_BY_INN':
            setError('inn', { message: backendError.message });
            break;
          case 'PARENT_CLIENT_NOT_FOUND':
            setGenericError(backendError.message);
            break;
          case 'VALIDATION_ERROR':
            // Массовая простановка ошибок полей от бэкенда
            if (backendError.errors) {
              backendError.errors.forEach((err) => {
                const fieldName = err.field.split('.').pop() as keyof FormData;
                if (fieldName) {
                  setError(fieldName, { message: err.message });
                }
              });
            } else {
              setGenericError(backendError.message);
            }
            break;
          default:
            setGenericError(backendError.message || 'Произошла ошибка сервера');
        }
      } else {
        setGenericError('Произошла непредвиденная ошибка');
      }
    }
  };

  // Нельзя выбрать самого себя как родителя при редактировании
  const filteredClientOptions = client
    ? clientOptions.filter((c) => c.clientId !== client.clientId)
    : clientOptions;

  const handleOpenParentSelect = () => {
    fetchParentOptions();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* 
          Используем handleSubmit(handleFormSubmit) для интеграции с RHF. 
          Валидация произойдет автоматически при нажатии на кнопку с type="submit".
      */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogTitle>
          {client ? 'Редактирование клиента' : 'Новый клиент'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {genericError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {genericError}
              </Alert>
            )}

            {/* 
                Используем Controller для интеграции MUI компонентов с React Hook Form.
                Это обеспечивает "контролируемость" инпутов без лишних useState.
            */}
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
                <TextField {...field} label="Полное название" fullWidth />
              )}
            />

            <Controller
              name="partyType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.partyType}>
                  <InputLabel>Тип стороны *</InputLabel>
                  <Select {...field} label="Тип стороны *">
                    <MenuItem value={PARTY_TYPES.LEGAL}>
                      Юридическое лицо
                    </MenuItem>
                    <MenuItem value={PARTY_TYPES.INDIVIDUAL}>
                      Физическое лицо
                    </MenuItem>
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
              name="parentId"
              control={control}
              render={({ field }) => {
                // Пытаемся найти текущее значение среди опций или дозагруженного родителя
                const selectedParent =
                  clientOptions.find((c) => c.clientId === field.value) ||
                  (initialParentClient &&
                  initialParentClient.clientId === field.value
                    ? initialParentClient
                    : null) ||
                  null;

                return (
                  <Autocomplete
                    options={isFetching ? [] : filteredClientOptions}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.clientId === value.clientId
                    }
                    value={selectedParent}
                    onChange={(_, value) => {
                      field.onChange(value?.clientId || '');
                    }}
                    onOpen={handleOpenParentSelect}
                    loading={isFetching}
                    renderInput={(params) => (
                      <TextField {...params} label="Родительский клиент" />
                    )}
                  />
                );
              }}
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
