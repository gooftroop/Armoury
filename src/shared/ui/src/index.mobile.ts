/**
 * @armoury/ui — Mobile Component Library (React Native / Tamagui)
 *
 * Mobile-specific entry point for React Native consumers.
 * All components use Tamagui primitives and the shared theming system.
 *
 * @requirements
 * 1. Must export all UI components with named exports.
 * 2. Must not use default exports.
 * 3. Must provide type exports for component props.
 * 4. Must re-export from `.mobile.tsx` implementations only.
 */

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
} from '@/components/AlertDialog/AlertDialog.mobile.js';

// Avatar components
export {
    Avatar,
    AvatarImage,
    AvatarFallback,
    avatarVariants,
    type AvatarProps,
    type AvatarImageProps,
    type AvatarFallbackProps,
} from '@/components/Avatar/Avatar.mobile.js';

// Badge component
export { Badge, badgeVariants, type BadgeProps } from '@/components/Badge/Badge.mobile.js';

// Button component
export { Button, buttonVariants, type ButtonProps } from '@/components/Button/Button.mobile.js';

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
} from '@/components/Card/Card.mobile.js';

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
} from '@/components/Dialog/Dialog.mobile.js';

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
} from '@/components/DropdownMenu/DropdownMenu.mobile.js';

// Input component
export { Input, type InputProps } from '@/components/Input/Input.mobile.js';

// Label component
export { Label, type LabelProps } from '@/components/Label/Label.mobile.js';

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
} from '@/components/Select/Select.mobile.js';

// Separator component
export { Separator, type SeparatorProps } from '@/components/Separator/Separator.mobile.js';

// Skeleton component
export { Skeleton, type SkeletonProps } from '@/components/Skeleton/Skeleton.mobile.js';

// Switch component
export { Switch, type SwitchProps } from '@/components/Switch/Switch.mobile.js';

// Tabs components
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    type TabsListProps,
    type TabsTriggerProps,
    type TabsContentProps,
} from '@/components/Tabs/Tabs.mobile.js';

// Toast components
export {
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
    toastVariants,
    type ToastProps,
    type ToastActionProps,
    type ToastCloseProps,
    type ToastTitleProps,
    type ToastDescriptionProps,
} from '@/components/Toast/Toast.mobile.js';

// Tooltip components
export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    type TooltipTriggerProps,
    type TooltipContentProps,
} from '@/components/Tooltip/Tooltip.mobile.js';
