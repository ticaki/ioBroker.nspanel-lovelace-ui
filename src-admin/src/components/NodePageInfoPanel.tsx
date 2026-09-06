import React from 'react';
import { Paper, Box, Button, Typography } from '@mui/material';
import { I18n } from '@iobroker/gui-components';

export interface NodePageInfoPanelProps {
    open: boolean;
    data?: Record<string, any> | null;
    title?: string;
    sx?: any;
    /** Opens the page configuration; only set for pages coming from the admin */
    onOpenPageConfig?: () => void;
    /** Icons to show next to a field, as SVG markup using `currentColor`, by field name */
    iconSvgs?: Record<string, string[]>;
    /** Note to show behind the value of a field, e.g. where it is read from, by field name */
    hints?: Record<string, string>;
}

/**
 * Info panel shown next to the navigation flow
 *
 * @param props Panel state, page info and optionally the jump to the page configuration
 */
export default function NodePageInfoPanel(props: NodePageInfoPanelProps): React.ReactElement {
    const { open, data, title, sx, onOpenPageConfig, iconSvgs, hints } = props;
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
                            sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}
                        >
                            <Typography
                                component="div"
                                variant="body2"
                            >
                                <strong>{I18n.t(k)}</strong>: {String(v)}
                            </Typography>
                            {iconSvgs?.[k]?.map((svg, index) => (
                                <Box
                                    key={`${k}-${index}`}
                                    component="span"
                                    aria-hidden="true"
                                    // Statisches Markup aus der mitgelieferten Icon-Liste
                                    dangerouslySetInnerHTML={{ __html: svg }}
                                    sx={{
                                        color: 'text.primary',
                                        display: 'inline-flex',
                                        '& svg': { width: 18, height: 18, display: 'block' },
                                    }}
                                />
                            ))}
                            {hints?.[k] ? (
                                <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                >
                                    {hints[k]}
                                </Typography>
                            ) : null}
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
            {onOpenPageConfig ? (
                // The panel itself is click-through, the button must not be
                <Box sx={{ mt: 1, pointerEvents: 'auto' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={onOpenPageConfig}
                    >
                        {I18n.t('nav_open_page_config')}
                    </Button>
                </Box>
            ) : null}
        </Paper>
    );
}
