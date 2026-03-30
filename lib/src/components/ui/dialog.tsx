import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "easyleap-fixed easyleap-inset-0 easyleap-z-50 easyleap-bg-black/80 data-[state=open]:easyleap-animate-in data-[state=closed]:easyleap-animate-out data-[state=closed]:easyleap-fade-out-0 data-[state=open]:easyleap-fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    closeClassName?: string;
    closeStyle?: React.CSSProperties;
    onClickClose?: () => void;
  }
>(({ className, children, closeClassName, closeStyle, onClickClose, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "easyleap-fixed easyleap-left-[50%] easyleap-top-[50%] easyleap-z-50 easyleap-grid easyleap-max-w-[100vw] easyleap-w-[425px] easyleap-translate-x-[-50%] easyleap-translate-y-[-50%] easyleap-gap-4 easyleap-p-6 easyleap-shadow-lg easyleap-duration-200 data-[state=open]:easyleap-animate-in data-[state=closed]:easyleap-animate-out data-[state=closed]:easyleap-fade-out-0 data-[state=open]:easyleap-fade-in-0 data-[state=closed]:easyleap-zoom-out-95 data-[state=open]:easyleap-zoom-in-95 data-[state=closed]:easyleap-slide-out-to-left-1/2 data-[state=closed]:easyleap-slide-out-to-top-[48%] data-[state=open]:easyleap-slide-in-from-left-1/2 data-[state=open]:easyleap-slide-in-from-top-[48%] easyleap-rounded-[10px]",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "easyleap-absolute easyleap-right-4 easyleap-top-4 easyleap-rounded-sm easyleap-opacity-70 easyleap-ring-offset-black easyleap-transition-opacity hover:easyleap-opacity-100 focus:easyleap-outline-none focus:easyleap-ring-2 focus:easyleap-ring-[#0A0A0A] focus:easyleap-ring-offset-2 disabled:easyleap-pointer-events-none data-[state=open]:easyleap-bg-transparent data-[state=open]:easyleap-text-[#757575]",
          closeClassName
        )}
        style={closeStyle}
        onClick={onClickClose}
      >
        <X className="easyleap-h-4 easyleap-w-4" />
        <span className="easyleap-sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "easyleap-flex easyleap-flex-col easyleap-space-y-1.5 easyleap-text-center sm:easyleap-text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "easyleap-flex easyleap-flex-col-reverse sm:easyleap-flex-row sm:easyleap-justify-end sm:easyleap-space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("easyleap-tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("easyleap-text-sm easyleap-text-[#757575]", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger
};
