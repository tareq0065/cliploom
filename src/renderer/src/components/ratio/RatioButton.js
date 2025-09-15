import { memo, useMemo } from 'react';
import { useEditor } from '../EditorContext';

function RatioIcon({ w, h, active }) {
  const { iw, ih, ix, iy } = useMemo(() => {
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

function RatioButtonBase({ label, active, onClick, w, h }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex flex-col items-center justify-center gap-1',
        'rounded-md px-2 py-2 border transition-colors',
        active
          ? 'bg-blue-50 border-blue-600 text-blue-700'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100',
      ].join(' ')}
      title={label}
    >
      <RatioIcon w={w} h={h} active={active} />
      <span className="text-[8px] font-medium leading-none">{label}</span>
    </button>
  );
}

export default memo(function RatioButton({ item }) {
  const { ratioKey, setRatioKey } = useEditor();
  const active = ratioKey === item.key;
  return (
    <RatioButtonBase
      label={item.label}
      active={active}
      w={item.w}
      h={item.h}
      onClick={() => setRatioKey(item.key)}
    />
  );
});
