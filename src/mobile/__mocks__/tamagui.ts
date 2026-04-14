import * as React from 'react';

function makeComponent(name: string) {
    return function MockComponent({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) {
        return React.createElement(name.toLowerCase(), { 'data-testid': name, ...props }, children);
    };
}

function makeInteractive(name: string) {
    return function MockInteractive({
        children,
        onPress,
        ...props
    }: Record<string, unknown> & { children?: React.ReactNode; onPress?: () => void }) {
        return React.createElement(name.toLowerCase(), { 'data-testid': name, onClick: onPress, ...props }, children);
    };
}

export const TamaguiProvider = ({ children }: { children: React.ReactNode }) => children;
export const YStack = makeComponent('YStack');
export const XStack = makeComponent('XStack');
export const Card = makeComponent('Card');
export const H1 = makeComponent('H1');
export const H2 = makeComponent('H2');
export const H3 = makeComponent('H3');
export const H4 = makeComponent('H4');
export const Paragraph = makeComponent('Paragraph');
export const ScrollView = makeComponent('ScrollView');
export const Button = makeInteractive('Button');
export const createTamagui = (config: unknown) => config;

export const AlertDialog = Object.assign(
    function MockAlertDialog({
        children,
        open,
        onOpenChange: _onOpenChange,
    }: {
        children?: React.ReactNode;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    }) {
        if (!open) {return null;}

        return React.createElement('div', { 'data-testid': 'AlertDialog' }, children);
    },
    {
        Portal: makeComponent('AlertDialog.Portal'),
        Overlay: makeComponent('AlertDialog.Overlay'),
        Content: makeComponent('AlertDialog.Content'),
        Title: makeComponent('AlertDialog.Title'),
        Description: makeComponent('AlertDialog.Description'),
        Cancel: function MockCancel({
            children,
            asChild: _asChild,
        }: {
            children?: React.ReactNode;
            asChild?: boolean;
        }) {
            return React.createElement('div', { 'data-testid': 'AlertDialog.Cancel' }, children);
        },
        Action: function MockAction({
            children,
            asChild: _asChild,
        }: {
            children?: React.ReactNode;
            asChild?: boolean;
        }) {
            return React.createElement('div', { 'data-testid': 'AlertDialog.Action' }, children);
        },
    },
);
