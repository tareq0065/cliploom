import { useEditor } from '../EditorContext';
import RatioSelector from '../ratio/RatioSelector';
import { ColorPickerPopover } from '../ColorPickerPopover';
import { Slider } from '../ui/slider';

export default function Sidebar() {
  const {
    // appearance
    shadow,
    setShadow,
    padding,
    setPadding,
    inset,
    setInset,
    radius,
    setRadius,
    // colors from context
    insetBgColor,
    setInsetBgColor, // used by CanvasArea background

    bgColorValue,
    setBgColorValue,
    gradientPresets, // array of gradients from context
  } = useEditor();

  return (
    <aside className="w-64 shrink-0 h-full border-r border-neutral-200 bg-white text-neutral-800 overflow-y-auto">
      {/* Header */}
      <div className="h-14 flex items-center px-4 border-b border-neutral-200">
        <span className="font-semibold tracking-wide">Cliploom</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-6">
        {/* Ratios */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
            Ratio
          </h3>
          <RatioSelector />
        </div>

        {/* Appearance sliders */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
            Appearance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Shadow</span>
                <span className="text-[11px] text-neutral-500">{shadow}</span>
              </div>
              <Slider
                value={[shadow]}
                min={1}
                max={30}
                step={1}
                onValueChange={([v]) => setShadow(v)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Padding</span>
                <span className="text-[11px] text-neutral-500">
                  {padding}px
                </span>
              </div>
              <Slider
                value={[padding]}
                min={0}
                max={300}
                step={1}
                onValueChange={([v]) => setPadding(v)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Inset</span>
                <span className="text-[11px] text-neutral-500">{inset}px</span>
              </div>
              <Slider
                value={[inset]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => setInset(v)}
              />

              {/* Triggered color/gradient picker — writes to insetBgColor so CanvasArea updates */}
              <div className="flex items-center gap-3 mt-4">
                <ColorPickerPopover
                  value={insetBgColor ?? 'transparent'}
                  onChange={(val) => {
                    setInsetBgColor(val);
                  }}
                  width={220}
                  height={120}
                  triggerClassName="border border-neutral-300 rounded-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    setInsetBgColor('transparent');
                  }}
                  className="text-xs w-full px-2 py-1 h-[32px] rounded-sm border border-neutral-300 hover:bg-neutral-100"
                >
                  Transparent
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-neutral-500">Radius</span>
                <span className="text-[11px] text-neutral-500">{radius}px</span>
              </div>
              <Slider
                value={[radius]}
                min={0}
                max={100}
                step={1}
                onValueChange={([v]) => setRadius(v)}
              />
            </div>
          </div>
        </div>

        {/* Background / Color Picker */}
        <div>
          <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2">
            Background
          </h3>

          {/* Triggered color/gradient picker — writes to insetBgColor so CanvasArea updates */}
          <div className="flex items-center gap-3">
            <ColorPickerPopover
              value={bgColorValue ?? 'transparent'}
              onChange={(val) => {
                setBgColorValue(val);
              }}
              width={220}
              height={120}
              triggerClassName="border border-neutral-300 rounded"
            />
            <button
              type="button"
              onClick={() => {
                setBgColorValue('transparent');
              }}
              className="text-xs w-full h-[32px] px-2 py-1 rounded-sm border border-neutral-300 hover:bg-neutral-100"
            >
              White
            </button>
          </div>

          {/* Presets (from context) */}
          {!!gradientPresets?.length && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gradientPresets.map((g, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`preset-${i}`}
                  onClick={() => {
                    setBgColorValue(g);
                  }}
                  className="h-8 rounded-sm border border-neutral-300 hover:ring-2 hover:ring-neutral-300"
                  style={{ background: g }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
