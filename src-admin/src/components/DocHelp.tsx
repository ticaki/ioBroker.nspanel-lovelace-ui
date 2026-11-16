import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
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
}

/**
 * Small, pale "?" next to a heading or setting. The tooltip names the section, a click opens the
 * documentation at that section in a new tab.
 */
export class DocHelp extends React.Component<DocHelpProps> {
    render(): React.JSX.Element {
        const tooltip = docTooltip(this.props.topic);
        const ownSx: SystemStyleObject<Theme> = {
            p: 0.25,
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
                    <HelpOutlineIcon sx={{ fontSize: 16 }} />
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
