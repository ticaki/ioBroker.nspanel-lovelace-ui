// at the moment any

import { IconEntryType } from './types';

export type NavigationItem = {
    left?: NavigationItemParent | NavigationItemPrev;
    right?: NavigationItemNext | NavigationItemHome;
} | null;

type NavigationItemParent = {
    type: 'parent';
    page: Page;
    icon: IconEntryType;
};
type NavigationItemHome = {
    type: 'home';
    page: anPagey;
    icon: IconEntryType;
};
type NavigationItemPrev = {
    type: 'prev';
    page: Page;
    icon: IconEntryType;
};
type NavigationItemNext = {
    type: 'next';
    page: Page;
    icon: IconEntryType;
};
/*heading: string;
        items: PageItem[];
        useColor: boolean;
        subPage?: boolean;
        parent?: Page;
        parentIcon?: string;
        parentIconColor?: RGB;
        prev?: Page;
        prevIcon?: string;
        prevIconColor?: RGB;
        next?: string;
        nextIcon?: string;
        nextIconColor?: RGB;
        home?: string;
        homeIcon?: string;
        homeIconColor?: RGB;*/
