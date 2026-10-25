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
import { ChannelConfigDialogJsonConfig } from './components/ChannelConfigDialog';
import { installLabelHover } from './labelHover';

installLabelHover();

export default {
    NavigationView,
    IconSelect,
    IconOverview,
    PageConfigManager,
    ScreensaverConfigManager,
    PageGlobalSettings,
    TabMaintain,
    TabPanelinfo,
    PageMQTTSetting,
    PagePanelOverview,
    WebFidoKeys,
    ChannelConfigDialog: ChannelConfigDialogJsonConfig,
};
