import React from 'react';
import type { CardProps } from '../CardContract';
import { theme } from '../../style/theme';
import type { StubModel } from './stubParse';

/** Placeholder of a card that is not implemented yet: shows pageType and the raw arguments */
export class StubView extends React.Component<CardProps<StubModel>> {
    private renderArgs(label: string, args: string[] | undefined): React.JSX.Element | null {
        if (!args) {
            return null;
        }
        return (
            <div style={{ marginTop: 4 }}>
                <span style={{ color: theme.accent }}>{label}</span>{' '}
                {args.map((a, i) => (
                    <span
                        key={i}
                        style={{ color: i % 6 === 1 ? '#ffd54f' : theme.foreground }}
                    >
                        {i > 0 ? <span style={{ color: theme.muted }}>~</span> : null}
                        {a === '' ? '∅' : a}
                    </span>
                ))}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        return (
            <div
                data-page={ctx.pageType}
                style={{
                    position: 'absolute',
                    inset: 0,
                    padding: 8,
                    fontSize: 11,
                    lineHeight: '14px',
                    overflow: 'hidden',
                    wordBreak: 'break-all',
                    fontFamily: 'monospace',
                }}
            >
                <div style={{ fontSize: 16, fontFamily: theme.fontFamily }}>
                    {ctx.pageType}
                    {ctx.pageArgs.length ? (
                        <span style={{ color: theme.muted }}> ~{ctx.pageArgs.join('~')}</span>
                    ) : null}
                    <span style={{ color: theme.muted, fontSize: 11 }}> (not implemented yet)</span>
                </div>
                {this.renderArgs('entityUpd', model.entityUpd)}
                {this.renderArgs('entityUpdateDetail', model.entityUpdateDetail)}
                {model.commands.map((c, i) => (
                    <div key={i}>{this.renderArgs(c.cmd, c.args)}</div>
                ))}
            </div>
        );
    }
}
