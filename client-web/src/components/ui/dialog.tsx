"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogContext = React.createContext<{
    open: boolean
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
    open: false,
    setOpen: () => { },
})

export const Dialog = ({ children, open: controlledOpen, onOpenChange }: {
    children: React.ReactNode,
    open?: boolean,
    onOpenChange?: (open: boolean) => void
}) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        const newValue = typeof value === 'function' ? value(open) : value
        if (onOpenChange) {
            onOpenChange(newValue)
        }
        if (!isControlled) {
            setUncontrolledOpen(newValue)
        }
    }, [isControlled, onOpenChange, open])

    return (
        <DialogContext.Provider value={{ open, setOpen }}>
            {children}
        </DialogContext.Provider>
    )
}

export const DialogTrigger = ({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) => {
    const { setOpen } = React.useContext(DialogContext)

    // If asChild is true, we should clone the element, but strictly typing that is hard safely.
    // For now, we'll wrap in a slot-like div or clone if simple.
    // To keep it simple and robust, we just wrap behavior on click.

    return (
        <div onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
        }} className="inline-block cursor-pointer">
            {children}
        </div>
    )
}

export const DialogContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { open, setOpen } = React.useContext(DialogContext)

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setOpen(false)} />
            <div className={cn(
                "relative bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200",
                className
            )} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => setOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
                >
                    <X className="h-4 w-4 text-gray-500" />
                </button>
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-2",
            className
        )}
        {...props}
    />
)

export const DialogTitle = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
)
