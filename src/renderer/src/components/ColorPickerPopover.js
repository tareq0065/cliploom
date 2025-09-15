'use client';

import * as React from 'react';

import ColorPicker from 'react-best-gradient-color-picker';
import { Popover } from '@radix-ui/react-popover';
import { PopoverContent, PopoverTrigger } from './ui/popover';

export function ColorPickerPopover({
  value,
  onChange,
  width = 200,
  height = 100,
  triggerClassName = '',
  hideLabel = false,
}) {
  const [open, setOpen] = React.useState(false);

  // If transparent, feed white as fallback to the picker
  const pickerValue = value === 'transparent' ? '#ffffff' : value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={[
            'border rounded-sm',
            triggerClassName,
            'flex justify-center items-center',
          ].join(' ')}
          style={{
            background: value,
            width: 32,
            height: 32,
            padding: 0,
            borderStyle: value === 'transparent' ? 'dashed' : 'solid',
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-white rounded-sm shadow-md p-4">
        <ColorPicker
          value={pickerValue}
          onChange={(v) => onChange(v)}
          width={width}
          height={height}
          hidePresets
          hideInputs
          hideEyeDrop
          hideAdvancedSliders
          hideColorGuide
          hideInputType
          hideGradientStop
        />
      </PopoverContent>
    </Popover>
  );
}
