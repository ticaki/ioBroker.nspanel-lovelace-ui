import React from 'react';
import { Box, Button, IconButton, Link, Tooltip } from '@mui/material';
import { ThemeProvider, type SxProps, type Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { I18n } from '@iobroker/gui-components';
import { getDocSystemLanguage, resolveDocLanguage, setDocSystemLanguage, type DocLanguage } from '../docLink';
import { docTopicTitle, docTopicUrl, resolveDocTopic, type DocTopicRef } from '../docTopics';

/**
 * Language of the documentation links: the ioBroker system language (German -> German pages,
 * everything else -> English), the admin language as long as the system language is unknown.
 *
 * @returns `de` or `en`.
 */
export function docLanguage(): DocLanguage {
    return resolveDocLanguage(getDocSystemLanguage(), I18n.getLanguage());
}

/**
 * Link to a help topic in the current documentation language, for places that need the bare url.
 *
 * @param topic Key of a registered topic or a topic object.
 * @returns Absolute url.
 */
export function docHref(topic: DocTopicRef): string {
    return docTopicUrl(resolveDocTopic(topic), docLanguage());
}

/**
 * Tooltip of a help link: "Help: <section>" or, for a whole page, "Open the documentation".
 *
 * @param topic Key of a registered topic or a topic object.
 * @returns The translated text.
 */
export function docTooltip(topic: DocTopicRef): string {
    const title = docTopicTitle(resolveDocTopic(topic), docLanguage());
    return title ? `${I18n.t('docHelpTooltip')}: ${title}` : I18n.t('docHelpOpenPage');
}

/**
 * Keeps a click on a help link from reaching the surrounding element (accordion, list item, ...).
 *
 * @param event The click.
 */
function stopClick(event: React.MouseEvent): void {
    event.stopPropagation();
}

/**
 * Puts the caller's styles after the component's own ones.
 *
 * @param own Styles of the component.
 * @param extra Styles from the props.
 * @returns The combined styles.
 */
function mergeSx(own: SystemStyleObject<Theme>, extra: SxProps<Theme> | undefined): SxProps<Theme> {
    return [own, ...(Array.isArray(extra) ? extra : [extra ?? {}])];
}

interface DocHelpProps {
    /** Key of a registered topic (`docTopics/<area>.ts`) or a topic object. */
    topic: DocTopicRef;
    /** Extra styles of the icon button, e.g. `{ ml: 1 }`. */
    sx?: SxProps<Theme>;
    /** `tiny`: a smaller "?" (13 px), e.g. the one help link in the corner of a panel card. Default `small`. */
    size?: 'small' | 'tiny';
}

/**
 * Small, pale "?" next to a heading or setting. The tooltip names the section, a click opens the
 * documentation at that section in a new tab.
 */
export class DocHelp extends React.Component<DocHelpProps> {
    render(): React.JSX.Element {
        const tooltip = docTooltip(this.props.topic);
        const tiny = this.props.size === 'tiny';
        const ownSx: SystemStyleObject<Theme> = {
            p: tiny ? '1px' : 0.25,
            ml: 0.5,
            verticalAlign: 'middle',
            color: 'text.secondary',
            opacity: 0.55,
            '&:hover': { opacity: 1 },
        };
        return (
            <Tooltip title={tooltip}>
                <IconButton
                    size="small"
                    href={docHref(this.props.topic)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={tooltip}
                    onClick={stopClick}
                    sx={mergeSx(ownSx, this.props.sx)}
                >
                    <HelpOutlineIcon sx={{ fontSize: tiny ? 13 : 16 }} />
                </IconButton>
            </Tooltip>
        );
    }
}

interface DocButtonProps {
    /** Key of a registered topic (`docTopics/<area>.ts`) or a topic object. */
    topic: DocTopicRef;
    /** Translated button text; default "Documentation". */
    label?: string;
    /** Extra styles of the button. */
    sx?: SxProps<Theme>;
}

/**
 * Visible documentation button for a tab or editor that the documentation describes in depth.
 * Opens the page (or section) in a new tab.
 */
export class DocButton extends React.Component<DocButtonProps> {
    render(): React.JSX.Element {
        const topic = resolveDocTopic(this.props.topic);
        const title = docTopicTitle(topic, docLanguage());
        const button = (
            <Button
                variant="text"
                size="small"
                color="primary"
                href={docHref(topic)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={stopClick}
                startIcon={<MenuBookOutlinedIcon />}
                sx={mergeSx({ textTransform: 'none' }, this.props.sx)}
            >
                {this.props.label ?? I18n.t('documentation')}
            </Button>
        );
        return title ? <Tooltip title={`${I18n.t('docHelpTooltip')}: ${title}`}>{button}</Tooltip> : button;
    }
}

/**
 * Tells a list of topics from a single one.
 *
 * @param topic One topic or a list.
 * @returns True for a list.
 */
function isTopicList(topic: DocTopicRef | readonly DocTopicRef[]): topic is readonly DocTopicRef[] {
    return Array.isArray(topic);
}

/**
 * Theme of the page around cards with their own `ThemeProvider` (e.g. orange or grey signal cards): a
 * `DocTooltip` inside such a card draws its tooltip with this theme, so it looks the same on every card.
 */
export const DocPageThemeContext = React.createContext<Theme | null>(null);

interface DocTooltipProps {
    /** One or more help topics; each becomes a link line "Help: <section>" in the tooltip. */
    topic: DocTopicRef | readonly DocTopicRef[];
    /** Translated hint shown above the links, e.g. why a button is disabled. */
    hint?: string;
    /** Styles of the wrapper around the child, e.g. the flex settings the child had in its row. */
    sx?: SxProps<Theme>;
    /** The element the tooltip belongs to: a button, a field, a label. */
    children: React.ReactNode;
}

/**
 * Help link for elements that repeat, e.g. the buttons and fields of a panel card, where a visible
 * "?" per element would clutter the view: the element gets an interactive tooltip with an optional hint
 * and a link per topic ("Help: <section>" plus a small arrow) that opens the documentation in a new tab.
 *
 * The child is wrapped in a `span` so a disabled button still shows the tooltip. The tooltip stays open
 * while the mouse moves into it. On touch devices a long press opens it; `leaveTouchDelay` keeps it
 * open for 3 s afterwards (the MUI default of 1.5 s is too short to reach the link) - no own context menu.
 *
 * The tooltip is drawn in a popover style (`background.paper`, `text.primary`, a 2px `primary.main` border
 * and a shadow) instead of the grey MUI tooltip: the grey surface gives the theme's link colour no contrast.
 * On paper the link keeps the normal link colour (`primary.main`) and looks like every other link in the
 * admin; in a dark theme paper is dark. The link is always underlined - it is the only click target.
 *
 * Surface and link always take the colours of the page, not of a card: a tab whose cards set their own
 * `ThemeProvider` (light signal colours) provides the page theme via `DocPageThemeContext`, and the content
 * of the tooltip is rendered with it. Without the context the current theme is used.
 */
export class DocTooltip extends React.Component<DocTooltipProps> {
    static contextType = DocPageThemeContext;
    declare context: React.ContextType<typeof DocPageThemeContext>;

    /**
     * The topics as a list.
     *
     * @returns The topics of the props.
     */
    private topics(): readonly DocTopicRef[] {
        const topic = this.props.topic;
        return isTopicList(topic) ? topic : [topic];
    }

    render(): React.JSX.Element {
        const title = (
            <Box
                component="span"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    border: 2,
                    borderColor: 'primary.main',
                    borderRadius: 1,
                    boxShadow: 4,
                    px: 1.25,
                    py: 0.75,
                }}
            >
                {this.props.hint ? (
                    <Box
                        component="span"
                        sx={{ color: 'text.primary' }}
                    >
                        {this.props.hint}
                    </Box>
                ) : null}
                {this.topics().map((topic, index) => (
                    <Link
                        key={index}
                        href={docHref(topic)}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="always"
                        onClick={stopClick}
                        sx={{ display: 'inline' }}
                    >
                        {docTooltip(topic)}
                        <NorthEastIcon sx={{ fontSize: 14, ml: 0.25, verticalAlign: 'text-bottom' }} />
                    </Link>
                ))}
            </Box>
        );
        // the surface is drawn by the content, so it can take the colours of the page theme
        const pageTheme = this.context;
        return (
            <Tooltip
                title={pageTheme ? <ThemeProvider theme={pageTheme}>{title}</ThemeProvider> : title}
                leaveTouchDelay={3000}
                slotProps={{ tooltip: { sx: { bgcolor: 'transparent', p: 0 } } }}
            >
                <Box
                    component="span"
                    sx={mergeSx({ display: 'inline-flex', maxWidth: '100%' }, this.props.sx)}
                >
                    {this.props.children}
                </Box>
            </Tooltip>
        );
    }
}

/** The part of the custom component props the documentation language is read from. */
interface DocLanguageProps {
    oContext?: { systemConfig?: { language?: string } };
}

/**
 * Wraps a custom component of `Components.tsx` so the ioBroker system language reaches the help
 * links (`setDocSystemLanguage`) before the component renders.
 *
 * @param Inner The custom component.
 * @returns The wrapped component with the same props.
 */
export function withDocLanguage<P extends DocLanguageProps>(Inner: React.ComponentType<P>): React.ComponentClass<P> {
    return class WithDocLanguage extends React.Component<P> {
        constructor(props: P) {
            super(props);
            setDocSystemLanguage(props.oContext?.systemConfig?.language);
        }

        componentDidUpdate(): void {
            setDocSystemLanguage(this.props.oContext?.systemConfig?.language);
        }

        render(): React.ReactNode {
            return React.createElement(Inner, this.props);
        }
    };
}
