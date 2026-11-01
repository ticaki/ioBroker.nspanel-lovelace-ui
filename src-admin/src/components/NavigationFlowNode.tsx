import React from 'react';
import { Box, Typography } from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { I18n } from '@iobroker/gui-components';
import type { NavigationLinkKind } from '../../../src/lib/types/navigationEdit';
import {
    EDGE_COLOR_HEX,
    HANDLE_EDGE_KIND,
    LINK_HANDLES,
    NODE_STYLE_VAR,
    nodeStyleOf,
    type NavigationFlowNodeData,
} from '../navigationFlowConst';

/** Node type of the flow - what React Flow hands to the component */
export type NavigationFlowNodeType = Node<NavigationFlowNodeData, 'custom'>;

/**
 * Position of a handle on the node, by handle id - the same for the source and the target handle
 * of that id. React Flow looks handles up by id only, so both must sit at the same place.
 */
const HANDLE_POSITION: Record<string, Position> = {
    prev: Position.Top,
    next: Position.Bottom,
    homeTopLeft: Position.Left,
    homeTopRight: Position.Right,
    parentBottomLeft: Position.Left,
    parentBottomRight: Position.Right,
    targetRight: Position.Right,
    targetLeft: Position.Left,
};

/** Link kinds in the order their handles are rendered */
const LINK_ORDER: NavigationLinkKind[] = ['prev', 'next', 'home', 'parent'];

/**
 * Class of a handle: the corner handles are positioned by their class name (see NavigationView.css).
 *
 * @param id Handle id.
 * @returns The class, `undefined` for the centred top/bottom handles.
 */
function cornerClass(id: string): string | undefined {
    return id === 'prev' || id === 'next' ? undefined : id;
}

/**
 * Lock drawn on a generated page: its navigation cannot be changed, whatever the page item that
 * generated it comes from. Shared with the legend.
 */
export class GeneratedPageMarker extends React.PureComponent {
    render(): React.ReactElement {
        return (
            <LockOutlinedIcon
                className="node-marker-icon"
                titleAccess={I18n.t('nav_edit_generated_page')}
            />
        );
    }
}

/**
 * Pencil drawn on a script page whose navigation the admin overrides. In warning colour when
 * the script changed since the override was made. Shared with the legend.
 */
export class OverrideMarker extends React.PureComponent<{ stale: boolean }> {
    render(): React.ReactElement {
        const { stale } = this.props;
        return (
            <EditOutlinedIcon
                className={stale ? 'node-marker-icon node-marker-icon-stale' : 'node-marker-icon'}
                titleAccess={I18n.t(stale ? 'nav_edit_override_stale' : 'nav_edit_override_active')}
            />
        );
    }
}

/**
 * A page or state node of the navigation flow.
 *
 * Outside the edit mode only the handles an edge uses are drawn, in the colour of that edge. In
 * edit mode every page shows the target handles of the four links, so a connection can be dropped
 * on it, and an editable page also shows the four source handles to drag a connection from.
 * A generated page carries a lock instead of source handles, a script page with a navigation
 * override of the admin a pencil.
 */
export default class NavigationFlowNode extends React.PureComponent<NodeProps<NavigationFlowNodeType>> {
    /**
     * Colour of a handle: the kind of the edge using it, else the kind the handle stands for.
     *
     * @param handleId Id of the handle.
     * @returns The hex colour.
     */
    private handleColor(handleId: string): string {
        const used = this.props.data.usedHandles ?? {};
        return EDGE_COLOR_HEX[used[handleId] ?? HANDLE_EDGE_KIND[handleId] ?? 'default'];
    }

    /**
     * Whether an edge uses a handle - only then it is drawn outside the edit mode.
     *
     * @param handleId Id of the handle.
     * @returns True if an edge starts or ends at it.
     */
    private isUsed(handleId: string): boolean {
        const used = this.props.data.usedHandles;
        return !!used && handleId in used;
    }

    /**
     * Target handle of one link kind - where a connection of that kind ends.
     *
     * @param kind The link.
     * @param editing Edit mode: the handle is always drawn, so a connection can be dropped on it.
     * @returns The handle, `null` when nothing is drawn.
     */
    private renderTargetHandle(kind: NavigationLinkKind, editing: boolean): React.ReactNode {
        const id = LINK_HANDLES[kind].target;
        if (!editing && !this.isUsed(id)) {
            return null;
        }
        return (
            <Handle
                key={`target-${kind}`}
                type="target"
                position={HANDLE_POSITION[id]}
                id={id}
                className={cornerClass(id)}
                style={{ background: this.handleColor(id) }}
                isConnectable={this.props.isConnectable}
                isConnectableStart={!editing}
            />
        );
    }

    /**
     * Source handle of one link kind - where a connection of that kind starts. Rendered after all
     * target handles: it shares its place with the target handle of the same id and must be the one
     * the pointer hits.
     *
     * @param kind The link.
     * @param editing Edit mode.
     * @param editable Edit mode and the page is editable: the handle is always drawn and can start a connection.
     * @returns The handle, `null` when nothing is drawn.
     */
    private renderSourceHandle(kind: NavigationLinkKind, editing: boolean, editable: boolean): React.ReactNode {
        const id = LINK_HANDLES[kind].source;
        if (!editable && !this.isUsed(id)) {
            return null;
        }
        return (
            <Handle
                key={`source-${kind}`}
                type="source"
                position={HANDLE_POSITION[id]}
                id={id}
                className={[cornerClass(id), editable ? 'handle-edit-source' : undefined].filter(Boolean).join(' ')}
                style={{ background: editable ? EDGE_COLOR_HEX[kind] : this.handleColor(id) }}
                isConnectable={this.props.isConnectable}
                isConnectableStart={!editing || editable}
                title={editable ? I18n.t('nav_edit_drag_source').replace('%s', kind) : undefined}
            />
        );
    }

    /**
     * Click on the collapse button - must neither select nor drag the node.
     *
     * @param event The click.
     */
    private handleToggleCollapse = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        this.props.data.onToggleCollapse?.(this.props.id);
    };

    /**
     * Button to collapse/expand the sub pages; collapsed it shows how many pages are hidden.
     *
     * @returns The button, `null` for a page without sub pages.
     */
    private renderCollapseButton(): React.ReactNode {
        const { collapse, onToggleCollapse } = this.props.data;
        if (!collapse || !onToggleCollapse) {
            return null;
        }
        return (
            <button
                type="button"
                className={`node-collapse nodrag${collapse.collapsed ? ' node-collapse-collapsed' : ''}`}
                onClick={this.handleToggleCollapse}
                title={
                    collapse.collapsed
                        ? I18n.t('nav_expand').replace('%n', String(collapse.hidden))
                        : I18n.t('nav_collapse')
                }
            >
                {collapse.collapsed ? `+${collapse.hidden}` : <RemoveIcon className="node-collapse-icon" />}
            </button>
        );
    }

    render(): React.ReactElement {
        const { data } = this.props;
        const entry = data.entry;
        const style = nodeStyleOf(entry);
        const vars = NODE_STYLE_VAR[style];
        const isPage = style !== 'stateRef';
        const generated = isPage && !!data.generated;
        const editing = !!data.editing && isPage;
        const editable = editing && !!data.editable && !generated;
        const classes = ['node-box'];
        if (style === 'stateRef') {
            classes.push('node-state-ref');
        }
        if (editing) {
            classes.push('node-editing');
        }
        if (data.unsaved) {
            classes.push('node-unsaved');
        }
        if (generated) {
            classes.push('node-generated');
        }
        return (
            <Box
                className={classes.join(' ')}
                style={{
                    background: `var(${vars.bg})`,
                    borderColor: `var(${vars.border})`,
                }}
                title={entry?.stateId}
            >
                {LINK_ORDER.map(kind => this.renderTargetHandle(kind, editing))}
                {LINK_ORDER.map(kind => this.renderSourceHandle(kind, editing, editable))}
                {/* targetPages: rechts Mitte (source), links Mitte (target) - nicht editierbar */}
                {this.isUsed('targetRight') ? (
                    <Handle
                        type="source"
                        position={HANDLE_POSITION.targetRight}
                        id="targetRight"
                        style={{ background: this.handleColor('targetRight'), top: '50%' }}
                        isConnectable={this.props.isConnectable}
                        isConnectableStart={false}
                    />
                ) : null}
                {this.isUsed('targetLeft') ? (
                    <Handle
                        type="target"
                        position={HANDLE_POSITION.targetLeft}
                        id="targetLeft"
                        style={{ background: this.handleColor('targetLeft'), top: '50%' }}
                        isConnectable={this.props.isConnectable}
                        isConnectableStart={false}
                    />
                ) : null}
                {data.unsaved ? (
                    <span
                        className="node-unsaved-marker"
                        title={I18n.t('nav_edit_unsaved_node')}
                    />
                ) : null}
                {generated ? (
                    <span className="node-marker node-marker-generated">
                        <GeneratedPageMarker />
                    </span>
                ) : null}
                {this.renderCollapseButton()}
                {!generated && data.overrideState ? (
                    <span className="node-marker node-marker-override">
                        <OverrideMarker stale={data.overrideState === 'stale'} />
                    </span>
                ) : null}
                <Typography
                    variant="body2"
                    color="text.primary"
                    className="node-label"
                    sx={{ position: 'relative', zIndex: 2, cursor: 'move' }}
                >
                    {data.label}
                </Typography>
            </Box>
        );
    }
}
