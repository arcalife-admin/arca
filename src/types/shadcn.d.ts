// This file extends the shadcn/ui component types to allow common props
import * as React from 'react'
import { LucideProps } from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as SliderPrimitive from '@radix-ui/react-slider'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as LabelPrimitive from '@radix-ui/react-label'
import * as SelectPrimitive from '@radix-ui/react-select'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu'

declare module 'lucide-react' {
  // Extend LucideIcon components to accept className prop
  interface LucideProps {
    className?: string
  }
}

declare module '@radix-ui/react-popover' {
  // Extend PopoverContent to accept className 
  interface PopoverContentProps {
    className?: string
  }

  // Extend PopoverTrigger to accept asChild
  interface PopoverTriggerProps {
    asChild?: boolean
  }
}

declare module '@radix-ui/react-slider' {
  // Extend SliderProps to accept className
  interface SliderProps {
    className?: string
  }
}

declare module '@radix-ui/react-dialog' {
  // Extend DialogContent to accept className
  interface DialogContentProps {
    className?: string
  }
}

declare module '@radix-ui/react-label' {
  // Extend LabelProps to accept htmlFor
  interface LabelProps {
    htmlFor?: string
  }
}

declare module '@radix-ui/react-select' {
  // Extend SelectTrigger props
  interface SelectTriggerProps {
    className?: string
    autoFocus?: boolean
    onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
    tabIndex?: number
  }

  // Extend SelectContent props
  interface SelectContentProps {
    className?: string
    onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  }
}

declare module '@radix-ui/react-tooltip' {
  // Extend TooltipProvider props
  interface TooltipProviderProps {
    children: React.ReactNode
  }

  // Extend TooltipContent props
  interface TooltipContentProps {
    className?: string
  }
}

declare module '@/components/ui/tooltip' {
  // Extend Tooltip component props
  interface TooltipProps {
    children: React.ReactNode
  }

  // Extend TooltipContent props
  interface TooltipContentProps {
    className?: string
  }
}

declare module '@radix-ui/react-context-menu' {
  // Extend ContextMenuItem props
  interface ContextMenuItemProps {
    onClick?: () => void
  }
}

declare module '@/components/ui/button' {
  // Extend Button props
  interface ButtonProps {
    className?: string
    onClick?: React.MouseEventHandler<HTMLButtonElement>
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    asChild?: boolean
    title?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    tabIndex?: number
    style?: React.CSSProperties
    form?: string
  }
}

declare module '@/components/ui/input' {
  // Extend Input props
  interface InputProps {
    value?: string | number
    onChange?: React.ChangeEventHandler<HTMLInputElement>
    placeholder?: string
    className?: string
    autoFocus?: boolean
    id?: string
    type?: string
    min?: string | number
    max?: string | number
    step?: number
    required?: boolean
    tabIndex?: number
    disabled?: boolean
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    onFocus?: React.FocusEventHandler<HTMLInputElement>
  }
}

declare module '@radix-ui/react-scroll-area' {
  // Extend ScrollArea props
  interface ScrollAreaProps {
    className?: string
  }
}

// Allow className on HTMLDivElement
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      className?: string;
      key?: React.Key;
    }
  }
}

// Add more declarations as needed 