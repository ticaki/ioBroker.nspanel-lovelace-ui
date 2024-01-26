import { AdapterClassDefinition } from '../classes/library';
import { Panel } from '../controller/panel';
import { RGB } from '../types/types';
import { Card, Page } from './Page';

export const commands = {
    cardMedia: {
        on: '1374',
        pause: '65535',
    },
};
export interface PageMedia {
    mediaNamespace: string;
    device: string;
    dp: string;
    heading: string;
    alwaysOnDisplay: boolean;
    album: string;
    titel: listItem;
    duration: string;
    elapsed: string;
    artist: listItem;
    shuffle: string;
    icon: string;
    tracklist: listItem;
    playlist: listItem;
    equalizerList: listItem;
    repeat: listItem;
    toolstring: listItem;
}

export type PageMediaMessage = {
    event: 'entityUpd~';
    name: string;
    getNavigation: string;
    id: string;
    title: string;
    titelColor: string;
    artist: string;
    artistColor: string;
    volume: string;
    iconplaypause: string;
    onoffbutton: string;
    shuffle_icon: string;
    toolsString: object;
    speakerListString: object;
    playListString: object;
    trackListString: object;
    equalizerListString: object;
    repeatButtonString: object;
};

type listItem = { color: RGB; icon: string; list: string[] | string };
export type messageItem = {
    event?: 'input_sel' | '' | 'button';
    pageId: string;
    iconNumber: 0 | 1 | 2 | 3 | 4 | 5; // media0 usw.
    mode: 'speaker' | 'play' | 'tool' | 'track' | 'favor' | 'equal';
    icon: string;
    color: string;
    name: string;
    ident?: string;
};
const messageItemDefault: Required<Omit<messageItem, 'iconNumber' | 'mode'>> = {
    event: 'input_sel',
    pageId: '',
    icon: '',
    color: '',
    name: '',
    ident: '',
};

export class PageMedia1 extends Page {
    constructor(adapter: AdapterClassDefinition, panel: Panel, card: Card, name: string) {
        super(adapter, panel.panelSend, card, name);
    }

    /**
     * Create a part of the panel messsage for bottom icons. if event === '' u get '~~~~~~'.
     * default for event: input_sel
     * @param msg
     * @returns string
     */
    private getBottomMessages(
        msg:
            | (Partial<messageItem> & { iconNumber: messageItem['iconNumber']; pageId: messageItem['pageId'] })
            | undefined,
    ): string {
        if (!msg || !msg.pageId || !msg.icon || msg.event === '') return '~~~~~~';
        msg.event = msg.event === undefined ? 'input_sel' : msg.event;
        msg.pageId = `${msg.pageId}?${msg.mode}`;
        const iconNumber = msg.iconNumber;
        const temp: Partial<messageItem> = msg;
        delete temp.mode;
        delete temp.iconNumber;
        msg.ident = msg.ident || 'media0';
        const message: typeof messageItemDefault = Object.assign(messageItemDefault, temp);

        switch (iconNumber) {
            case 0: {
                message.ident = 'media0';
                break;
            }
            case 1: {
                message.ident = 'media1';
                break;
            }
            case 2: {
                message.ident = 'media2';
                break;
            }
            case 3: {
                message.ident = 'media3';
                break;
            }
            case 4: {
                message.ident = 'media4';
                break;
            }
            case 5: {
                message.ident = 'media5';
                break;
            }
        }
        return this.getPayload(message.event, message.pageId, message.icon, message.color, message.name, message.ident);
    }
}
