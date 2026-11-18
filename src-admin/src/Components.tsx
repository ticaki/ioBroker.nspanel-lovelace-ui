import IconSelect from './IconSelect';
import IconOverview from './IconOverview';
import NavigationView from './NavigationView';
import PageConfigManager from './PageConfigManager';
import ScreensaverConfigManager from './ScreensaverConfigManager';
import PageGlobalSettings from './PageGlobalSettings';
import TabMaintain from './TabMaintain';
import TabPanelinfo from './TabPanelinfo';
import PageMQTTSetting from './PageMQTTSetting';
import PagePanelOverview from './PagePanelOverview';
import WebFidoKeys from './WebFidoKeys';
import CustomTftUpload from './CustomTftUpload';
import PageDump from './PageDump';
import { ChannelConfigDialogJsonConfig } from './components/ChannelConfigDialog';
import { installLabelHover } from './labelHover';
import { withDocLanguage } from './components/DocHelp';

installLabelHover();

// withDocLanguage: hands the ioBroker system language to the documentation links (DocHelp/DocButton)
export default {
    NavigationView: withDocLanguage(NavigationView),
    IconSelect: withDocLanguage(IconSelect),
    IconOverview: withDocLanguage(IconOverview),
    PageConfigManager: withDocLanguage(PageConfigManager),
    ScreensaverConfigManager: withDocLanguage(ScreensaverConfigManager),
    PageGlobalSettings: withDocLanguage(PageGlobalSettings),
    TabMaintain: withDocLanguage(TabMaintain),
    TabPanelinfo: withDocLanguage(TabPanelinfo),
    PageMQTTSetting: withDocLanguage(PageMQTTSetting),
    PagePanelOverview: withDocLanguage(PagePanelOverview),
    WebFidoKeys: withDocLanguage(WebFidoKeys),
    CustomTftUpload: withDocLanguage(CustomTftUpload),
    PageDump: withDocLanguage(PageDump),
    ChannelConfigDialog: withDocLanguage(ChannelConfigDialogJsonConfig),
};
