/**
 * UI Component Library
 *
 * A production-ready component library built with Radix UI primitives and Tailwind CSS.
 * All components are designed for a dark tactical theme with military/tabletop gaming aesthetics.
 *
 * @requirements
 * 1. Must export all UI components with named exports.
 * 2. Must not use default exports.
 * 3. Must provide type exports for component props.
 */

// Button component and variants
export { Button, buttonVariants, type ButtonProps } from './button.js';

// Card components
export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    type CardProps,
    type CardHeaderProps,
    type CardTitleProps,
    type CardDescriptionProps,
    type CardContentProps,
    type CardFooterProps,
} from './card.js';

// Dialog components
export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    type DialogOverlayProps,
    type DialogContentProps,
    type DialogHeaderProps,
    type DialogFooterProps,
    type DialogTitleProps,
    type DialogDescriptionProps,
} from './dialog.js';

// DropdownMenu components
export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
    type DropdownMenuTriggerProps,
    type DropdownMenuContentProps,
    type DropdownMenuItemProps,
    type DropdownMenuCheckboxItemProps,
    type DropdownMenuRadioItemProps,
    type DropdownMenuLabelProps,
    type DropdownMenuSeparatorProps,
    type DropdownMenuShortcutProps,
    type DropdownMenuSubTriggerProps,
    type DropdownMenuSubContentProps,
} from './DropdownMenu.js';

// Avatar components
export {
    Avatar,
    AvatarImage,
    AvatarFallback,
    avatarVariants,
    type AvatarProps,
    type AvatarImageProps,
    type AvatarFallbackProps,
} from './avatar.js';

// Tooltip components
export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    type TooltipTriggerProps,
    type TooltipContentProps,
} from './tooltip.js';

// Tabs components
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    type TabsListProps,
    type TabsTriggerProps,
    type TabsContentProps,
} from './tabs.js';

// Badge component
export { Badge, badgeVariants, type BadgeProps } from './badge.js';

// Skeleton component
export { Skeleton, type SkeletonProps } from './skeleton.js';

// Separator component
export { Separator, type SeparatorProps } from './separator.js';

// Switch component
export { Switch, type SwitchProps } from './switch.js';

// Label component
export { Label, type LabelProps } from './label.js';

// Input component
export { Input, type InputProps } from './input.js';

// Select components
export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
    type SelectTriggerProps,
    type SelectContentProps,
    type SelectLabelProps,
    type SelectItemProps,
    type SelectSeparatorProps,
    type SelectScrollUpButtonProps,
    type SelectScrollDownButtonProps,
} from './select.js';

// AlertDialog components
export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    type AlertDialogOverlayProps,
    type AlertDialogContentProps,
    type AlertDialogHeaderProps,
    type AlertDialogFooterProps,
    type AlertDialogTitleProps,
    type AlertDialogDescriptionProps,
    type AlertDialogActionProps,
    type AlertDialogCancelProps,
} from './AlertDialog.js';

// Toast components
export {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
    type ToastProps,
    type ToastActionProps,
    type ToastCloseProps,
    type ToastTitleProps,
    type ToastDescriptionProps,
} from './toast.js';
