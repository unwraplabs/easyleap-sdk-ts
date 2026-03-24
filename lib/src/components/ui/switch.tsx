import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { Icons } from "@lib/components/Icons";
import { cn } from "@lib/utils";
import { useIsMobile } from "@lib/hooks/use-mobile";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return <SwitchPrimitives.Root
    className={cn(
      "easyleap-peer easyleap-relative easyleap-inline-flex easyleap-shrink-0 easyleap-cursor-pointer easyleap-items-center easyleap-rounded-full easyleap-border-2 easyleap-border-transparent easyleap-shadow-sm easyleap-transition-colors focus-visible:easyleap-outline-none focus-visible:easyleap-ring-2 focus-visible:easyleap-ring-[#0A0A0A] focus-visible:easyleap-ring-offset-2 focus-visible:easyleap-ring-offset-black disabled:easyleap-cursor-not-allowed disabled:easyleap-opacity-50 data-[state=checked]:easyleap-bg-[#1A1A1A] data-[state=unchecked]:easyleap-bg-[#E5E5E7]",
      className,
      "easyleap-h-full"
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "easyleap-peer/thumb easyleap-group easyleap-pointer-events-none easyleap-block easyleap-w-4 easyleap-rounded-full easyleap-shadow-lg easyleap-ring-0 easyleap-transition-transform data-[state=unchecked]:easyleap-translate-x-0.5",
        isMobile ? "data-[state=checked]:easyleap-translate-x-[2rem]" : "data-[state=checked]:easyleap-translate-x-[4.83rem]",
        isMobile ? "data-[state=unchecked]:easyleap-translate-x-0.5" : "data-[state=unchecked]:easyleap-translate-x-0.5"
      )}
    >
      <Icons.ethereumLogo className="easyleap-hidden easyleap-size-[30px] group-data-[state=checked]:easyleap-block" />
      <Icons.starknetLogo className="easyleap-block easyleap-size-[30px] group-data-[state=checked]:easyleap-hidden" />
    </SwitchPrimitives.Thumb>

    {/* Label shown when switch is ON (EVM mode) */}
    {!isMobile && <span className="easyleap-absolute easyleap-left-[15%] easyleap-hidden easyleap-text-sm !easyleap-text-white easyleap-font-semibold peer-data-[state=checked]/thumb:easyleap-block">
      EVM
    </span>}

    {/* Label shown when switch is OFF (Starknet mode) */}
    {!isMobile && <span className="easyleap-absolute easyleap-left-[33%] easyleap-block easyleap-text-sm !easyleap-text-white easyleap-font-semibold peer-data-[state=checked]/thumb:easyleap-hidden">
      Starknet
    </span>}

    {/* BRIDGE MODE - old "Bridge" label commented out */}
    {/* {!isMobile && <span className="easyleap-absolute easyleap-left-[15%] easyleap-hidden easyleap-text-sm !easyleap-text-white easyleap-font-semibold peer-data-[state=checked]/thumb:easyleap-block">
      Bridge
    </span>} */}
  </SwitchPrimitives.Root>
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
