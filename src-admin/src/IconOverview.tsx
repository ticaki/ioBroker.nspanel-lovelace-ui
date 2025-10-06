import icons from './icons.json';
import { Grid, Typography, Box, useTheme, TextField, InputAdornment, IconButton } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import React, { useRef, useState, useEffect } from 'react';
interface Icon {
    name: string;
    base64: string;
}

const typedIcons = icons as Icon[];

const IconOverview: React.FC = () => {
    const theme = useTheme();
    const [filter, setFilter] = useState('');
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent): void => {
            // Cmd+F (Mac) oder Ctrl+F (Win/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault();
                setShowFilter(true);
                setTimeout(() => filterRef.current?.focus(), 0);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const filteredIcons = filter
        ? typedIcons.filter(icon => icon.name.toLowerCase().includes(filter.toLowerCase()))
        : typedIcons;

    return (
        <Box sx={{ width: '100%', overflowX: 'auto', p: 2 }}>
            {(showFilter || filter) && (
                <TextField
                    inputRef={filterRef}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    label="Icons filtern"
                    variant="outlined"
                    size="small"
                    sx={{ mb: 2, width: 300 }}
                    InputProps={{
                        endAdornment: filter ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setFilter('');
                                        setShowFilter(false);
                                    }}
                                >
                                    <ClearIcon />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                    onBlur={() => {
                        if (!filter) {
                            setShowFilter(false);
                        }
                    }}
                />
            )}
            <Grid
                container
                spacing={2}
            >
                {filteredIcons.map(icon => (
                    <Grid
                        key={icon.name}
                        item
                        xs={4}
                        sm={3}
                        md={2}
                        lg={1}
                        xl={1}
                        sx={{ minWidth: 80, maxWidth: 120, flexBasis: 0 }}
                    >
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                        >
                            <span
                                style={{
                                    display: 'inline-flex',
                                    width: 40,
                                    height: 40,
                                    color: theme.palette.text.primary,
                                    marginBottom: 4,
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: atob(icon.base64.replace(/^data:image\/svg\+xml;base64,/, '')).replace(
                                        /<svg([^>]*)>/,
                                        '<svg$1 fill="currentColor">',
                                    ),
                                }}
                            />
                            <Typography
                                variant="caption"
                                align="center"
                                sx={{
                                    maxWidth: 104,
                                    maxHeight: 36,
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    whiteSpace: 'normal',
                                }}
                            >
                                {icon.name}
                            </Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default IconOverview;
