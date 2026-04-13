'use client';

/**
 * Toast Component
 *
 * A brief message that appears on the screen to provide feedback on an operation.
 * Built on Radix UI Toast primitive with Tailwind styling.
 *
 * @requirements
 * 1. Must export ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription,
 *    ToastClose, ToastAction components.
 * 2. Must use Radix UI Toast primitive from radix-ui package.
 * 3. Must use design tokens for styling.
 * 4. Must support variants: default, destructive.
 * 5. Must display displayName in React DevTools.
 */

import { Toast as ToastPrimitive } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type { ReactElement, ComponentPropsWithoutRef, Ref } from 'react';

import { cn } from '@/lib/utils.js';

/**
 * Toast variant styles using class-variance-authority.
 */
const toastVariants = cva(
    'group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-md border border-border p-4 pr-6 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
    {
        variants: {
            variant: {
                default: 'border bg-background text-foreground',
                destructive: 'destructive group border-destructive bg-destructive text-destructive-foreground',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

/**
 * Props for the Toast component.
 */
export interface ToastProps
    extends ComponentPropsWithoutRef<typeof ToastPrimitive.Root>, VariantProps<typeof toastVariants> {}

/**
 * Props for the ToastAction component.
 */
export type ToastActionProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Action>;

/**
 * Props for the ToastClose component.
 */
export type ToastCloseProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Close>;

/**
 * Props for the ToastTitle component.
 */
export type ToastTitleProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Title>;

/**
 * Props for the ToastDescription component.
 */
export type ToastDescriptionProps = ComponentPropsWithoutRef<typeof ToastPrimitive.Description>;

/**
 * ToastProvider component - provides toast context.
 */
const ToastProvider = ToastPrimitive.Provider;

/**
 * ToastViewport component - the viewport where toasts are rendered.
 *
 * @param props - Component props including className and standard Toast.Viewport attributes.
 * @param ref - Forwarded ref to the ol element.
 * @returns The rendered ToastViewport component.
 */
function ToastViewport({
    className,
    ref,
    ...props
}: ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport> & {
    ref?: Ref<HTMLOListElement>;
}): ReactElement {
    return (
        <ToastPrimitive.Viewport
            className={cn(
                'fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

ToastViewport.displayName = 'ToastViewport';

/**
 * Toast component - the main toast container.
 *
 * @param props - Component props including variant and standard Toast.Root attributes.
 * @param ref - Forwarded ref to the li element.
 * @returns The rendered Toast component.
 */
function Toast({ className, variant, ref, ...props }: ToastProps & { ref?: Ref<HTMLLIElement> }): ReactElement {
    return <ToastPrimitive.Root className={cn(toastVariants({ variant }), className)} ref={ref} {...props} />;
}

Toast.displayName = 'Toast';

/**
 * ToastAction component - an action button in the toast.
 *
 * @param props - Component props including className and standard Toast.Action attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered ToastAction component.
 */
function ToastAction({ className, ref, ...props }: ToastActionProps & { ref?: Ref<HTMLButtonElement> }): ReactElement {
    return (
        <ToastPrimitive.Action
            className={cn(
                'inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-secondary focus:outline-none focus:ring-1 focus:ring-ring disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive',
                className,
            )}
            ref={ref}
            {...props}
        />
    );
}

ToastAction.displayName = 'ToastAction';

/**
 * ToastClose component - the close button for the toast.
 *
 * @param props - Component props including className and standard Toast.Close attributes.
 * @param ref - Forwarded ref to the button element.
 * @returns The rendered ToastClose component.
 */
function ToastClose({ className, ref, ...props }: ToastCloseProps & { ref?: Ref<HTMLButtonElement> }): ReactElement {
    return (
        <ToastPrimitive.Close
            className={cn(
                'absolute right-1 top-1 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-1 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
                className,
            )}
            ref={ref}
            toast-close=""
            {...props}
        >
            <X className="h-4 w-4" />
        </ToastPrimitive.Close>
    );
}

ToastClose.displayName = 'ToastClose';

/**
 * ToastTitle component - the title of the toast.
 *
 * @param props - Component props including className and standard Toast.Title attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered ToastTitle component.
 */
function ToastTitle({ className, ref, ...props }: ToastTitleProps & { ref?: Ref<HTMLDivElement> }): ReactElement {
    return (
        <ToastPrimitive.Title className={cn('text-sm font-semibold [&+div]:text-xs', className)} ref={ref} {...props} />
    );
}

ToastTitle.displayName = 'ToastTitle';

/**
 * ToastDescription component - a description for the toast content.
 *
 * @param props - Component props including className and standard Toast.Description attributes.
 * @param ref - Forwarded ref to the div element.
 * @returns The rendered ToastDescription component.
 */
function ToastDescription({
    className,
    ref,
    ...props
}: ToastDescriptionProps & { ref?: Ref<HTMLDivElement> }): ReactElement {
    return <ToastPrimitive.Description className={cn('text-sm opacity-90', className)} ref={ref} {...props} />;
}

ToastDescription.displayName = 'ToastDescription';

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
