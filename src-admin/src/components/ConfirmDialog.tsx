import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    cancelText: string;
    confirmText: string;
    ariaTitleId?: string;
    ariaDescId?: string;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    cancelText,
    confirmText,
    ariaTitleId = 'confirm-dialog-title',
    ariaDescId = 'confirm-dialog-description',
}: ConfirmDialogProps): React.ReactElement {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby={ariaTitleId}
            aria-describedby={ariaDescId}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id={ariaTitleId}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText id={ariaDescId}>{description}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 2 }}>
                <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={onClose}
                >
                    {cancelText}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    fullWidth
                    onClick={onConfirm}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
