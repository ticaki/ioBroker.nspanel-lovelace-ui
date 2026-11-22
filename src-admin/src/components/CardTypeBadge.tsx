import React from 'react';
import { Box, Tooltip } from '@mui/material';
import type { SvgIconProps, SxProps, Theme } from '@mui/material';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeviceThermostatOutlinedIcon from '@mui/icons-material/DeviceThermostatOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import LinkIcon from '@mui/icons-material/Link';
import MenuOutlinedIcon from '@mui/icons-material/MenuOutlined';
import PieChartOutlineOutlinedIcon from '@mui/icons-material/PieChartOutlineOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined';
import ViewComfyOutlinedIcon from '@mui/icons-material/ViewComfyOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import { DocHelp } from './DocHelp';
import { cardDocTopic } from '../docTopics';
import { pageLinkCard } from '../../../src/lib/types/adminShareConfig';

/** Icon and i18n key of the type name of a card type. */
interface CardTypeInfo {
    Icon: React.ComponentType<SvgIconProps>;
    labelKey: string;
}

/** Icon of each card type the page editor can show; unknown types fall back to `FALLBACK_CARD_TYPE_ICON`. */
const CARD_TYPE_BADGES: Readonly<Partial<Record<string, CardTypeInfo>>> = {
    cardGrid: { Icon: GridViewOutlinedIcon, labelKey: 'page_type_grid' },
    cardGrid2: { Icon: ViewModuleOutlinedIcon, labelKey: 'page_type_grid2' },
    cardGrid3: { Icon: ViewComfyOutlinedIcon, labelKey: 'page_type_grid3' },
    cardEntities: { Icon: ViewListOutlinedIcon, labelKey: 'page_type_entities' },
    cardSchedule: { Icon: ScheduleOutlinedIcon, labelKey: 'page_type_schedule' },
    cardThermo: { Icon: ThermostatOutlinedIcon, labelKey: 'page_type_thermo' },
    cardThermo2: { Icon: DeviceThermostatOutlinedIcon, labelKey: 'page_type_thermo2' },
    cardMedia: { Icon: PlayCircleOutlineOutlinedIcon, labelKey: 'page_type_media' },
    cardAlarm: { Icon: SecurityOutlinedIcon, labelKey: 'page_type_alarm' },
    cardQR: { Icon: QrCode2OutlinedIcon, labelKey: 'page_type_qr' },
    cardPower: { Icon: BoltOutlinedIcon, labelKey: 'page_type_power' },
    cardChart: { Icon: ShowChartOutlinedIcon, labelKey: 'page_type_chart' },
    cardLChart: { Icon: ShowChartOutlinedIcon, labelKey: 'page_type_chart' },
    cardPChart: { Icon: PieChartOutlineOutlinedIcon, labelKey: 'page_type_pchart' },
    cardTrash: { Icon: DeleteOutlineIcon, labelKey: 'page_type_trash' },
    [pageLinkCard]: { Icon: LinkIcon, labelKey: 'page_type_pageLink' },
};

/** Icon of a card type without an entry in `CARD_TYPE_BADGES`; the tooltip then shows the raw type. */
const FALLBACK_CARD_TYPE_ICON: React.ComponentType<SvgIconProps> = MenuOutlinedIcon;

interface CardTypeIconProps {
    /** Card type of the page, e.g. `cardGrid`. */
    card: string;
    /** Translation function of the surrounding editor. */
    getText: (key: string) => string;
    /** Size and colour of the icon. */
    sx?: SxProps<Theme>;
}

/**
 * Icon of a card type with the translated type name as tooltip; used in the page list and in the
 * badge of the page editors.
 */
export class CardTypeIcon extends React.Component<CardTypeIconProps> {
    render(): React.JSX.Element {
        const { card, getText, sx } = this.props;
        const info = CARD_TYPE_BADGES[card];
        const Icon = info?.Icon ?? FALLBACK_CARD_TYPE_ICON;
        const typeName = info ? getText(info.labelKey) : card;
        const tooltip = `${getText('page_type')}: ${typeName}`;
        return (
            <Tooltip title={tooltip}>
                <Icon
                    aria-label={tooltip}
                    sx={sx}
                />
            </Tooltip>
        );
    }
}

interface CardTypeBadgeProps {
    /** Card type of the edited page. */
    card: string;
    /** Translation function of the surrounding editor. */
    getText: (key: string) => string;
}

/**
 * Type icon and help link of the edited page, in the top right corner of the grey "unique ID" box each
 * page editor starts with. The box needs `position: 'relative'`.
 */
export class CardTypeBadge extends React.Component<CardTypeBadgeProps> {
    render(): React.JSX.Element {
        const { card, getText } = this.props;
        return (
            <Box
                sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    lineHeight: 0,
                }}
            >
                <CardTypeIcon
                    card={card}
                    getText={getText}
                    sx={{ fontSize: 18, color: 'text.secondary' }}
                />
                <DocHelp
                    topic={cardDocTopic(card)}
                    sx={{ ml: 0.25 }}
                />
            </Box>
        );
    }
}
