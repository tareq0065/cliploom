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
  showCloseButton = true,
  showBuyButton = false,
}) {
  const triggerEl = React.isValidElement(trigger) ? (
    trigger
  ) : (
    <Button variant="secondary" size="sm">
      {triggerTitle}
    </Button>
  );

  const handleLinkClicks = React.useCallback((e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute('href');
    if (!href) return;

    // Prefer Electron shell if exposed, otherwise fall back to window.open
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(href);
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const isString = typeof description === 'string';

  return (
    <Dialog>
      <DialogTrigger asChild>{triggerEl}</DialogTrigger>

      <DialogContent
        className="sm:max-w-md bg-white text-accent"
        onClick={handleLinkClicks}
      >
        <DialogHeader>
          <DialogTitle>{title || 'Dialog title'}</DialogTitle>
        </DialogHeader>

        {isString ? (
          <DialogDescription
            // If the string is trusted (your own text), this is fine.
            // If it comes from users, sanitize before injecting.
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <DialogDescription>
            {description || 'Dialog description'}
          </DialogDescription>
        )}

        <DialogFooter className="sm:justify-start">
          {showCloseButton && (
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
          )}

          {showBuyButton && (
            <Button asChild variant="secondary">
              <a href="https://cliploom.gscodes.dev/pricing">Buy Now</a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
