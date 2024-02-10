// at the moment any

export type NavigationItemConfig = {
    name: string;
    left?: {
        single?: string;
        double?: string;
    };
    right?: {
        single?: string;
        double?: string;
    };
    page: string;
} | null;

export type NavigationItem = {
    left: {
        single?: number;
        double?: number;
    };
    right: {
        single?: number;
        double?: number;
    };
    page: Page;
} | null;

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
