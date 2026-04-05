// this file used only for simulation and not used in end build
import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { Box, Tab, Tabs } from '@mui/material';

import {
    GenericApp,
    I18n,
    type IobTheme,
    Loader,
    type GenericAppProps,
    type GenericAppState,
} from '@iobroker/adapter-react-v5';

import IconSelect from './IconSelect';
import IconOverview from './IconOverview';
import NavigationView from './NavigationView';
import PageConfigManager from './PageConfigManager';
import ScreensaverPage from './ScreensaverPage';
import PageGlobalSettings from './PageGlobalSettings';
import TabMaintain from './TabMaintain';
import TabPanelinfo from './TabPanelinfo';
import PageMQTTSetting from './PageMQTTSetting';
import PagePanelOverview from './PagePanelOverview';
import ChannelConfigDialog from './components/ChannelConfigDialog';

import enLocal from './i18n/en.json';
import deLocal from './i18n/de.json';
import ruLocal from './i18n/ru.json';
import ptLocal from './i18n/pt.json';
import nlLocal from './i18n/nl.json';
import frLocal from './i18n/fr.json';
import itLocal from './i18n/it.json';
import esLocal from './i18n/es.json';
import plLocal from './i18n/pl.json';
import ukLocal from './i18n/uk.json';
import zhCNLocal from './i18n/zh-cn.json';

const styles: Record<string, any> = {
    app: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    }),
    tabContent: {
        padding: 24,
        flex: 1,
        overflow: 'auto',
    },
};

interface AppState extends GenericAppState {
    data: Record<string, any>;
    originalData: Record<string, any>;
    activeTab: number;
}

class App extends GenericApp<GenericAppProps, AppState> {
    constructor(props: GenericAppProps) {
        const extendedProps = { ...props };
        super(props, extendedProps);

        this.state = {
            ...this.state,
            loaded: true, // skip ioBroker socket connection for local simulation
            data: { myCustomAttribute: 'red' },
            originalData: { myCustomAttribute: 'red' },
            theme: this.createTheme(),
            activeTab: 0,
        };
        const translations = {
            en: enLocal,
            de: deLocal,
            ru: ruLocal,
            pt: ptLocal,
            nl: nlLocal,
            fr: frLocal,
            it: itLocal,
            es: esLocal,
            pl: plLocal,
            uk: ukLocal,
            'zh-cn': zhCNLocal,
        };

        I18n.setTranslations(translations);
        // @ts-expect-error userLanguage could exist
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());
    }

    render(): React.JSX.Element {
        if (!this.state.loaded) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        const oCtx = {
            adapterName: 'nspanel-lovelace-ui',
            socket: this.socket,
            instance: 0,
            themeType: this.state.theme.palette.mode,
            isFloatComma: true,
            dateFormat: '',
            forceUpdate: () => {},
            systemConfig: {} as ioBroker.SystemConfigCommon,
            theme: this.state.theme,
            _themeName: this.state.themeName,
            onCommandRunning: (_commandRunning: boolean): void => {},
        };
        const commonProps = {
            oContext: oCtx,
            alive: true,
            changed: JSON.stringify(this.state.originalData) !== JSON.stringify(this.state.data),
            themeName: this.state.theme.palette.mode,
            themeType: this.state.theme.palette.mode as any,
            theme: this.state.theme,
            common: {} as ioBroker.InstanceCommon,
            data: this.state.data,
            originalData: this.state.originalData,
            onError: (): void => {},
            onChange: (attrOrData: string | Record<string, any>): void => {
                if (typeof attrOrData === 'object') {
                    this.setState({ data: attrOrData });
                }
            },
        };

        const tabs: { label: string; content: React.JSX.Element }[] = [
            {
                label: 'ChannelConfigDialog',
                content: (
                    <ChannelConfigDialog
                        socket={this.socket}
                        theme={this.state.theme}
                        themeType={this.state.themeType}
                        oContext={oCtx}
                        panelIds={[]}
                        initialChannelId="javascript.0.test.channel"
                    />
                ),
            },
            {
                label: 'IconSelect',
                content: (
                    <IconSelect
                        {...commonProps}
                        attr="myCustomAttribute"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/IconSelect',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'IconOverview',
                content: <IconOverview />,
            },
            {
                label: 'NavigationView',
                content: (
                    <NavigationView
                        {...commonProps}
                        attr="myCustomAttribute"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/NavigationView',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'PageConfigManager',
                content: (
                    <PageConfigManager
                        {...commonProps}
                        attr="pages"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/PageConfigManager',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'ScreensaverPage',
                content: (
                    <ScreensaverPage
                        {...commonProps}
                        attr="screensaver"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/ScreensaverPage',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'PageGlobalSettings',
                content: (
                    <PageGlobalSettings
                        {...commonProps}
                        attr="globalSettings"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/PageGlobalSettings',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'TabMaintain',
                content: (
                    <TabMaintain
                        {...commonProps}
                        attr="maintain"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/TabMaintain',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'TabPanelinfo',
                content: (
                    <TabPanelinfo
                        {...commonProps}
                        attr="panelinfo"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/TabPanelinfo',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'PageMQTTSetting',
                content: (
                    <PageMQTTSetting
                        {...commonProps}
                        attr="mqttSetting"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/PageMQTTSetting',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'PagePanelOverview',
                content: (
                    <PagePanelOverview
                        {...commonProps}
                        attr="panelOverview"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/PagePanelOverview',
                            type: 'custom',
                        }}
                    />
                ),
            },
        ];

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box sx={styles.app}>
                        <Tabs
                            value={this.state.activeTab}
                            onChange={(_e, v: number) => this.setState({ activeTab: v })}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {tabs.map(t => (
                                <Tab
                                    key={t.label}
                                    label={t.label}
                                />
                            ))}
                        </Tabs>
                        <Box style={styles.tabContent}>{tabs[this.state.activeTab].content}</Box>
                    </Box>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default App;
