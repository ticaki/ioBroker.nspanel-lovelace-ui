import type * as Types from './types';
import type { NSPanel } from './NSPanel';

export type PageLightItem = NSPanel.PageLightItem;

export type PageItemColorSwitch = NSPanel.PageItemColorSwitch;

export type IconBoolean = NSPanel.IconBoolean;
export type ThisCardMessageTypes = NSPanel.ThisCardMessageTypes;

export interface MessageItem extends NSPanel.MessageItemInterface {
    mainId?: string;
    subId?: string;
}
export type entityUpdateDetailMessage = NSPanel.entityUpdateDetailMessage;

//export type entityUpdateDetailMessageType = '2Sliders' | 'insel';

export interface MessageItemInterface {
    type: Types.SerialTypePopup;
    intNameEntity: string;
    icon: string;
    iconColor: string;
    displayName: string;
    optionalValue: string;
}
export type MediaToolBoxAction = NSPanel.MediaToolBoxAction;
export type PageItemDataItems = NSPanel.PageItemDataItems;

export function isPageItemDataItemsOptions(obj: any): obj is NSPanel.PageItemDataItemsOptions {
    if (!obj || typeof obj !== 'object') {
        return false;
    }

    // With Template
    if ('template' in obj && typeof obj.template === 'string') {
        return true;
    }

    // Without Template, but with type and data
    if ('type' in obj && typeof obj.type === 'string' && 'data' in obj) {
        return true;
    }

    return false;
}
export function islistCommandUnion(F: any): F is NSPanel.listCommandUnion {
    switch (F as NSPanel.listCommandUnion) {
        case 'flip': {
            return true;
        }
    }
    return false;
}
