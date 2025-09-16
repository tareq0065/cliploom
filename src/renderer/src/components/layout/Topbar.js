import React from 'react';
import { useEditor } from '../EditorContext';
import { Button } from '../ui/button';
import { CustomDialog } from '../CustomDialog';

export default function Topbar() {
  const { openFromClipboard, setScreenshot, copyToClipboard, saveFile } =
    useEditor();

  return (
    <div className="h-14 flex justify-between items-center px-3 border-b border-neutral-200">
      {/* Left side actions */}
      <div className="flex gap-2"></div>

      {/* Right side actions */}
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setScreenshot('')}>
          Clear
        </Button>
        <CustomDialog
          trigger={
            <Button variant="secondary" size="sm">
              Open From Clipboard
            </Button>
          }
          title="Open From Clipboard"
          description="This feature is for premium users only. Please buy the app to use it."
          showBuyButton={true}
          showCloseButton={false}
        />
        {/*<Button variant="secondary" size="sm" onClick={openFromClipboard}>*/}
        {/*  Open From Copy*/}
        {/*</Button>*/}
        {/*<Button variant="secondary" size="sm" onClick={openFromFile}>*/}
        {/*  File*/}
        {/*</Button>*/}
        <CustomDialog
          trigger={
            <Button variant="secondary" size="sm">
              File
            </Button>
          }
          title="Open a file"
          description="This feature is for premium users only. Please buy the app to use it."
          showBuyButton={true}
          showCloseButton={false}
        />
        <Button variant="secondary" size="sm" onClick={copyToClipboard}>
          Copy
        </Button>
        <Button variant="secondary" size="sm" onClick={saveFile}>
          Save
        </Button>
      </div>
    </div>
  );
}
