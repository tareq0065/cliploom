'use client';

import { useCallback, useMemo, useState } from 'react';
import { useEditor } from '../EditorContext';
import { Link2, Link2Off } from 'lucide-react';

function RatioIcon({ w, h, active }) {
  const dims = useMemo(() => {
    const boxW = 28,
      boxH = 18;
    const padX = 4,
      padY = 3;
    const maxW = boxW - padX * 2;
    const maxH = boxH - padY * 2;

    if (!w || !h) {
      const size = Math.min(maxW, maxH);
      return {
        iw: size,
        ih: size,
        ix: (boxW - size) / 2,
        iy: (boxH - size) / 2,
      };
    }
    const aspect = w / h;
    let iw = maxW;
    let ih = iw / aspect;
    if (ih > maxH) {
      ih = maxH;
      iw = ih * aspect;
    }
    return { iw, ih, ix: (boxW - iw) / 2, iy: (boxH - ih) / 2 };
  }, [w, h]);

  const { iw, ih, ix, iy } = dims;

  return (
    <svg
      width="28"
      height="18"
      viewBox="0 0 28 18"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x={ix}
        y={iy}
        width={iw}
        height={ih}
        rx="2"
        ry="2"
        className={active ? 'stroke-blue-600' : 'stroke-gray-400'}
        fill="none"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function clampInt(v, min = 1, max = 8192) {
  const n = parseInt(v || '0', 10);
  if (!Number.isFinite(n)) return NaN;
  return Math.max(min, Math.min(max, n));
}

export default function CustomRatioCard({ active, onSelect, value }) {
  const { setCustomSize } = useEditor();

  const [locked, setLocked] = useState(true);
  const [aspect, setAspect] = useState(() => {
    const a = value?.w && value?.h ? value.w / value.h : 1;
    return Number.isFinite(a) && a > 0 ? a : 1;
  });

  const captureAspect = useCallback((w, h) => {
    const a = w && h ? w / h : 1;
    return Number.isFinite(a) && a > 0 ? a : 1;
  }, []);

  const toggleLock = useCallback(
    (e) => {
      e.stopPropagation();
      setLocked((prev) => {
        const next = !prev;
        if (next) setAspect(captureAspect(value?.w, value?.h));
        return next;
      });
    },
    [value?.w, value?.h, captureAspect],
  );

  const onChangeW = useCallback(
    (e) => {
      const nextW = clampInt(e.target.value);
      if (!Number.isFinite(nextW)) return;
      if (locked) {
        const nextH = Math.max(1, Math.round(nextW / aspect));
        setCustomSize((prev) => ({ ...prev, w: nextW, h: nextH }));
      } else {
        setCustomSize((prev) => ({ ...prev, w: nextW }));
      }
    },
    [locked, aspect, setCustomSize],
  );

  const onChangeH = useCallback(
    (e) => {
      const nextH = clampInt(e.target.value);
      if (!Number.isFinite(nextH)) return;
      if (locked) {
        const nextW = Math.max(1, Math.round(nextH * aspect));
        setCustomSize((prev) => ({ ...prev, w: nextW, h: nextH }));
      } else {
        setCustomSize((prev) => ({ ...prev, h: nextH }));
      }
    },
    [locked, aspect, setCustomSize],
  );

  return (
    <div
      className={[
        'group flex flex-col items-center justify-start gap-2 rounded-md p-2 border transition-colors mt-2',
        active
          ? 'bg-blue-50 border-blue-600 text-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100',
      ].join(' ')}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      title="Custom"
    >
      <RatioIcon w={value?.w} h={value?.h} active={active} />
      <span className="text-[8px] font-medium leading-none">Custom</span>

      {active && (
        <div className="flex items-center gap-2 w-full">
          <label className="flex items-center gap-1 text-[10px]">
            W
            <input
              type="number"
              min={1}
              max={8192}
              step={1}
              value={value?.w ?? ''}
              onChange={onChangeW}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          <button
            type="button"
            onClick={toggleLock}
            onMouseDown={(e) => e.stopPropagation()}
            className={[
              'flex items-center justify-center w-8 h-8',
              locked ? 'text-blue-600' : 'text-gray-700 hover:text-blue-400',
            ].join(' ')}
            aria-pressed={locked}
            aria-label={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            title={locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {locked ? <Link2 size={16} /> : <Link2Off size={16} />}
          </button>

          <label className="flex items-center gap-1 text-[10px]">
            H
            <input
              type="number"
              min={1}
              max={8192}
              step={1}
              value={value?.h ?? ''}
              onChange={onChangeH}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-16 rounded border border-gray-300 px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}
