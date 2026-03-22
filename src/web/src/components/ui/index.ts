/**
 * UI Component Library
 *
 * Re-exports all components from @armoury/ui.
 * Web consumers should import from this barrel or directly from '@armoury/ui'.
 *
 * @requirements
 * 1. Must re-export all UI components from @armoury/ui.
 * 2. Must not use default exports.
 * 3. Must provide type exports for component props.
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
} from '@armoury/ui';

// Avatar components
export {
    Avatar,
    AvatarImage,
    AvatarFallback,
    avatarVariants,
    type AvatarProps,
    type AvatarImageProps,
    type AvatarFallbackProps,
} from '@armoury/ui';

// Badge component
export { Badge, badgeVariants, type BadgeProps } from '@armoury/ui';

// Button component and variants
export { Button, buttonVariants, type ButtonProps } from '@armoury/ui';

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
} from '@armoury/ui';

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
} from '@armoury/ui';

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
} from '@armoury/ui';

// Input component
export { Input, type InputProps } from '@armoury/ui';

// Label component
export { Label, type LabelProps } from '@armoury/ui';

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
} from '@armoury/ui';

// Separator component
export { Separator, type SeparatorProps } from '@armoury/ui';

// Skeleton component
export { Skeleton, type SkeletonProps } from '@armoury/ui';

// Switch component
export { Switch, type SwitchProps } from '@armoury/ui';

// Tabs components
export {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    type TabsListProps,
    type TabsTriggerProps,
    type TabsContentProps,
} from '@armoury/ui';

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
} from '@armoury/ui';

// Tooltip components
export {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
    type TooltipTriggerProps,
    type TooltipContentProps,
} from '@armoury/ui';
