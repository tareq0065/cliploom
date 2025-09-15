'use client';

import React from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

export function CustomDialog({
  trigger,
  triggerTitle = 'Open',
  title,
  description,
  children,
}) {
  const triggerEl = React.isValidElement(trigger) ? (
    trigger
  ) : (
    <Button variant="outline">{triggerTitle}</Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white text-accent">
        <DialogHeader>
          <DialogTitle>{title || 'Dialog title'}</DialogTitle>
          <DialogDescription>
            {description || 'Dialog description'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">{children}</div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
