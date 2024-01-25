// at the moment any

import { Icon } from './types';

export type NavigationItem = {
    left?: NavigationItemParent | NavigationItemPrev;
    right?: NavigationItemNext | NavigationItemHome;
} | null;

type NavigationItemParent = {
    type: 'parent';
    page: Page;
    icon: Icon;
};
type NavigationItemHome = {
    type: 'home';
    page: anPagey;
    icon: Icon;
};
type NavigationItemPrev = {
    type: 'prev';
    page: Page;
    icon: Icon;
};
type NavigationItemNext = {
    type: 'next';
    page: Page;
    icon: Icon;
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
