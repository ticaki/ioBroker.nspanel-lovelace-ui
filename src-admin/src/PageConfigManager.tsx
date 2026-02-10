import React from 'react';
import { Box, Typography } from '@mui/material';
import { withTheme } from '@mui/styles';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type {
    PageConfigEntry,
    NavigationAssignmentList,
    PageConfigBaseFields,
} from '../../src/lib/types/adminShareConfig';
import { ADAPTER_NAME, SENDTO_GET_PAGES_All_COMMAND } from '../../src/lib/types/adminShareConfig';
import { PageConfigLayout, type PageCardType } from './components/PageConfigLayout';
import { PageAlarmEditor } from './components/PageAlarmEditor';
import { PageQREditor } from './components/PageQREditor';
import { PageTrashEditor } from './components/PageTrashEditor';

interface PageConfigManagerState extends ConfigGenericState {
    entries: PageConfigEntry[];
    selected: string;
    selectedCardType: PageCardType;
    pagesList: string[];
    alive: boolean;
    pagesRetryCount: number;
}

class PageConfigManager extends ConfigGeneric<ConfigGenericProps & { theme?: any }, PageConfigManagerState> {
    private pagesRetryTimeout?: NodeJS.Timeout;

    constructor(props: ConfigGenericProps & { theme?: any }) {
        super(props);
        const saved = ConfigGeneric.getValue(props.data, props.attr!);
        this.state = {
            ...(this.state as ConfigGenericState),
            entries: Array.isArray(saved) ? (saved as PageConfigEntry[]) : [],
            selected: '',
            selectedCardType: 'all', // Default: alle anzeigen
            pagesList: [],
            alive: false,
            pagesRetryCount: 0,
        } as PageConfigManagerState;
    }

    componentWillUnmount(): void {
        if (this.pagesRetryTimeout) {
            clearTimeout(this.pagesRetryTimeout);
        }
        const instance = this.props.oContext.instance ?? '0';
        this.props.oContext.socket.unsubscribeState(
            `system.adapter.${ADAPTER_NAME}.${instance}.alive`,
            this.onAliveChanged,
        );
    }

    async componentDidMount(): Promise<void> {
        super.componentDidMount();

        const instance = this.props.oContext.instance ?? '0';
        const aliveStateId = `system.adapter.${ADAPTER_NAME}.${instance}.alive`;

        try {
            const state = await this.props.oContext.socket.getState(aliveStateId);
            const isAlive = !!state?.val;
            this.setState({ alive: isAlive } as PageConfigManagerState);

            await this.props.oContext.socket.subscribeState(aliveStateId, this.onAliveChanged);

            if (isAlive) {
                await this.loadPagesList();
            }
        } catch (error) {
            console.error('[PageConfig] Failed to get alive state or subscribe:', error);
            this.setState({ alive: false } as PageConfigManagerState);
        }
    }

    onAliveChanged = (_id: string, state: ioBroker.State | null | undefined): void => {
        const wasAlive = this.state.alive;
        const isAlive = state ? !!state.val : false;

        if (wasAlive !== isAlive) {
            this.setState({ alive: isAlive } as PageConfigManagerState);

            if (!wasAlive && isAlive && (!this.state.pagesList || this.state.pagesList.length === 0)) {
                void this.loadPagesList();
            }

            if (wasAlive && !isAlive && this.pagesRetryTimeout) {
                clearTimeout(this.pagesRetryTimeout);
                this.pagesRetryTimeout = undefined;
            }
        }
    };

    private async loadPagesList(): Promise<void> {
        if (!this.state.alive) {
            console.log('[PageConfig] Adapter not alive, skipping pages load');
            return;
        }

        const pages: string[] = [];
        if (this.props.oContext && this.props.oContext.socket) {
            const instance = this.props.oContext.instance ?? '0';
            const target = `${ADAPTER_NAME}.${instance}`;
            try {
                const rawPages = await this.props.oContext.socket.sendTo(target, SENDTO_GET_PAGES_All_COMMAND, null);
                let list: string[] = [];
                if (Array.isArray(rawPages)) {
                    list = rawPages;
                } else if (rawPages && Array.isArray(rawPages.result)) {
                    list = rawPages.result;
                }
                for (const name of list) {
                    pages.push(name);
                }

                if (list.length === 0) {
                    const currentRetryCount = this.state.pagesRetryCount || 0;
                    const retryDelay = 3000;

                    console.log(
                        `[PageConfig] Got empty pages array, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1})`,
                    );

                    this.setState({ pagesRetryCount: currentRetryCount + 1 } as PageConfigManagerState);

                    if (this.pagesRetryTimeout) {
                        clearTimeout(this.pagesRetryTimeout);
                    }

                    this.pagesRetryTimeout = setTimeout(() => {
                        if (this.state.alive) {
                            void this.loadPagesList();
                        } else {
                            console.log('[PageConfig] Adapter went offline, cancelling pages retry');
                        }
                    }, retryDelay);

                    return;
                } else if (list.length > 0) {
                    console.log(
                        `[PageConfig] Successfully loaded ${list.length} pages after ${this.state.pagesRetryCount || 0} retries`,
                    );
                    this.setState({ pagesRetryCount: 0 } as PageConfigManagerState);
                    if (this.pagesRetryTimeout) {
                        clearTimeout(this.pagesRetryTimeout);
                        this.pagesRetryTimeout = undefined;
                    }
                }
            } catch (error) {
                const currentRetryCount = this.state.pagesRetryCount || 0;
                const retryDelay = 3000;

                console.log(
                    `[PageConfig] Error loading pages, retrying in ${retryDelay}ms (attempt ${currentRetryCount + 1}): ${String(error)}`,
                );

                this.setState({ pagesRetryCount: currentRetryCount + 1 } as PageConfigManagerState);

                if (this.pagesRetryTimeout) {
                    clearTimeout(this.pagesRetryTimeout);
                }

                this.pagesRetryTimeout = setTimeout(() => {
                    if (this.state.alive) {
                        void this.loadPagesList();
                    } else {
                        console.log('[PageConfig] Adapter went offline, cancelling pages retry after error');
                    }
                }, retryDelay);

                return;
            }
        } else {
            console.log('[PageConfig] No socket available for sendTo');
            return;
        }

        this.setState({ pagesList: Array.from(new Set(pages)) } as PageConfigManagerState);
    }

    private handleAdd = (name: string, cardType: PageCardType): void => {
        if (cardType === 'all') {
            return; // Sollte nicht vorkommen (Button ist disabled)
        }

        let newEntry: PageConfigEntry;

        if (cardType === 'cardAlarm') {
            newEntry = {
                card: 'cardAlarm',
                uniqueName: name,
                headline: name,
                button1: '',
                button2: '',
                button3: '',
                button4: '',
                button5: '',
                button6: '',
                button7: '',
                button8: '',
                pin: 0,
            };
        } else if (cardType === 'cardQR') {
            newEntry = {
                card: 'cardQR',
                uniqueName: name,
                headline: name,
                ssidUrlTel: '',
                wlanhidden: false,
                pwdhidden: false,
                setState: '',
                selType: 0,
            };
        } else if (cardType === 'cardTrash') {
            newEntry = {
                card: 'cardTrash',
                uniqueName: name,
                headline: name,
                countItems: 4, // Default: 4 Müllarten
                trashImport: true, // Default: Import from iCal Adapter
                trashState: '',
                trashFile: '',
                items: [
                    { textTrash: '', customTrash: '', iconColor: '#3c3fff', icon: '' },
                    { textTrash: '', customTrash: '', iconColor: '#fffd77', icon: '' },
                    { textTrash: '', customTrash: '', iconColor: '#d2d2d2', icon: '' },
                    { textTrash: '', customTrash: '', iconColor: '#de8900', icon: '' },
                    { textTrash: '', customTrash: '', iconColor: '#d2d2d2', icon: '' },
                    { textTrash: '', customTrash: '', iconColor: '#d2d2d2', icon: '' },
                ],
            };
        } else {
            return; // Unbekannter Typ
        }

        const updated = [...this.state.entries, newEntry];
        this.setState({ entries: updated } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);
    };

    private handleDelete = (name: string): void => {
        const updated = this.state.entries.filter(e => e.uniqueName !== name);
        this.setState({ entries: updated } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);

        const remaining = Array.from(new Set(updated.map(e => e.uniqueName))).filter(Boolean);
        this.setState({ selected: remaining[0] || '' } as PageConfigManagerState);
    };

    private handleAssign = (uniqueName: string, assignments: NavigationAssignmentList): void => {
        const updated = this.state.entries.map(it =>
            it.uniqueName === uniqueName ? { ...it, navigationAssignment: assignments } : it,
        );
        this.setState({ entries: updated } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);
    };

    private handleEntryChange = (updatedEntry: PageConfigEntry): void => {
        const updated = this.state.entries.map(it => (it.uniqueName === updatedEntry.uniqueName ? updatedEntry : it));
        this.setState({ entries: updated } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);
    };

    private handleUniqueNameChange = (oldName: string, newName: string): void => {
        if (!newName.trim()) {
            return;
        }
        const updated = this.state.entries.map(it => (it.uniqueName === oldName ? { ...it, uniqueName: newName } : it));
        this.setState({ entries: updated, selected: newName } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);
    };

    private handleCardTypeChange = (cardType: PageCardType): void => {
        // Beim Wechsel des Card-Typs: filtere Einträge und wähle ersten passenden aus
        const filteredEntries =
            cardType === 'all' ? this.state.entries : this.state.entries.filter(e => e.card === cardType);
        const newSelected = filteredEntries.length > 0 ? filteredEntries[0].uniqueName : '';
        this.setState({ selectedCardType: cardType, selected: newSelected } as PageConfigManagerState);
    };

    private handleCommonFieldsChange = (uniqueName: string, fields: Partial<PageConfigBaseFields>): void => {
        const updated = this.state.entries.map(it => (it.uniqueName === uniqueName ? { ...it, ...fields } : it));
        this.setState({ entries: updated } as PageConfigManagerState);
        void this.onChange(this.props.attr!, updated);
    };

    private renderMiddlePanel(): React.JSX.Element {
        const { selected, entries, pagesList } = this.state;

        if (!selected) {
            return (
                <Box>
                    <Typography variant="h6">{this.getText('select_item')}</Typography>
                    <Box sx={{ mt: 2 }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {this.getText('select_description')}
                        </Typography>
                    </Box>
                </Box>
            );
        }

        const currentEntry = entries.find(e => e.uniqueName === selected);
        if (!currentEntry) {
            return (
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {this.getText('Entry not found')}
                </Typography>
            );
        }

        // Render different panels based on card type
        if (currentEntry.card === 'cardAlarm') {
            return (
                <PageAlarmEditor
                    entry={currentEntry}
                    pagesList={pagesList}
                    onEntryChange={this.handleEntryChange}
                    onUniqueNameChange={this.handleUniqueNameChange}
                    getText={key => this.getText(key)}
                    oContext={this.props.oContext}
                    theme={this.props.theme}
                />
            );
        }

        if (currentEntry.card === 'cardQR') {
            return (
                <PageQREditor
                    entry={currentEntry}
                    onEntryChange={this.handleEntryChange}
                    onUniqueNameChange={this.handleUniqueNameChange}
                    getText={key => this.getText(key)}
                    oContext={this.props.oContext}
                    theme={this.props.theme}
                />
            );
        }

        if (currentEntry.card === 'cardTrash') {
            return (
                <PageTrashEditor
                    entry={currentEntry}
                    onEntryChange={this.handleEntryChange}
                    onUniqueNameChange={this.handleUniqueNameChange}
                    getText={key => this.getText(key)}
                    oContext={this.props.oContext}
                    theme={this.props.theme}
                />
            );
        }

        return (
            <Typography variant="body2">
                {currentEntry.card} - {this.getText('coming_soon')}
            </Typography>
        );
    }

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element {
        const currentEntry = this.state.entries.find(e => e.uniqueName === this.state.selected);

        return (
            <PageConfigLayout
                entries={this.state.entries}
                selected={this.state.selected}
                selectedCardType={this.state.selectedCardType}
                onSelectedChange={(selected: string) => this.setState({ selected } as PageConfigManagerState)}
                onCardTypeChange={this.handleCardTypeChange}
                onAdd={this.handleAdd}
                onDelete={this.handleDelete}
                onAssign={this.handleAssign}
                oContext={this.props.oContext}
                getText={(key: string) => this.getText(key)}
                navigationPanelProps={{
                    ...this.props,
                    data: this.props.data,
                    onChange: this.props.onChange,
                    onError: this.props.onError,
                    // Gemeinsame Felder für aktuellen Eintrag
                    commonFields: currentEntry
                        ? {
                              hidden: (currentEntry as any).hidden,
                              alwaysOn: (currentEntry as any).alwaysOn,
                              navigationAssignment: (currentEntry as any).navigationAssignment,
                          }
                        : undefined,
                    onCommonFieldsChange: currentEntry
                        ? (fields: Partial<PageConfigBaseFields>) => {
                              this.handleCommonFieldsChange(currentEntry.uniqueName, fields);
                          }
                        : undefined,
                }}
            >
                {this.renderMiddlePanel()}
            </PageConfigLayout>
        );
    }
}

export default withTheme(PageConfigManager);
