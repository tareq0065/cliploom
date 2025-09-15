'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const Slider = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className,
      )}
      {...props}
    >
      {/* Track */}
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-200">
        <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
      </SliderPrimitive.Track>

      {/* Thumb */}
      <SliderPrimitive.Thumb
        className={cn(
          'block h-4 w-4 rounded-full border border-neutral-400 bg-white shadow',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = 'Slider';

export { Slider };
