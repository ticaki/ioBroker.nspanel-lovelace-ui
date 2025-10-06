import icons from './icons.json';
import { Grid, Typography, Box, useTheme } from '@mui/material';
interface Icon {
    name: string;
    base64: string;
}

const typedIcons = icons as Icon[];
const IconOverview: React.FC = () => {
    const theme = useTheme();
    return (
        <Box sx={{ width: '100%', overflowX: 'auto', p: 2 }}>
            <Grid
                container
                spacing={2}
            >
                {typedIcons.map(icon => (
                    <Grid
                        key={icon.name}
                        item
                        xs={4} // 3 Icons pro Zeile auf sehr kleinen Displays
                        sm={3} // 4 Icons pro Zeile auf kleinen Displays
                        md={2} // 6 Icons pro Zeile auf mittleren Displays
                        lg={1} // ca. 20 Icons pro Zeile auf FullHD
                        xl={1} // noch mehr auf sehr großen Displays
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
                                noWrap
                                sx={{ maxWidth: 80 }}
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
