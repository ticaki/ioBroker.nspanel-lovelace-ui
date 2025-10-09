import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { I18n } from '@iobroker/adapter-react-v5';

export interface NodePageInfoPanelProps {
    open: boolean;
    data?: Record<string, any> | null;
    title?: string;
    sx?: any;
}

export default function NodePageInfoPanel({ open, data, title, sx }: NodePageInfoPanelProps): React.ReactElement {
    // place under header / controls (approx)
    const topPx = 64;

    return (
        <Paper
            elevation={6}
            role="dialog"
            aria-label={title || I18n.t('Page Info')}
            sx={{
                position: 'absolute',
                top: topPx,
                right: 0,
                width: 320,
                p: 1,
                zIndex: 4000,
                maxHeight: 420,
                overflow: 'auto',
                transform: open ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 220ms ease',
                borderTopLeftRadius: 6,
                borderBottomLeftRadius: 6,
                boxShadow: 'rgba(0,0,0,0.2) -4px 0px 8px',
                pointerEvents: 'none',
                ...sx,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2">{title ?? I18n.t('Page Info')}</Typography>
            </Box>

            <Box sx={{ mt: 1 }}>
                {data && Object.keys(data).length ? (
                    Object.entries(data).map(([k, v]) => (
                        <Box
                            key={k}
                            sx={{ mb: 0.5 }}
                        >
                            <Typography
                                component="div"
                                variant="body2"
                            >
                                <strong>{I18n.t(k)}</strong>: {String(v)}
                            </Typography>
                        </Box>
                    ))
                ) : (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {I18n.t('No data')}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
}
