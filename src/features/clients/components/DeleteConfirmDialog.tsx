import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import type { Client } from '../types';

interface Props {
  open: boolean;
  client: Client | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  client,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Удаление клиента</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Вы уверены, что хотите удалить клиента "{client?.name}"? Это действие
          нельзя отменить.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          Удалить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
