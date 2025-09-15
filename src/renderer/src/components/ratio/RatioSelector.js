import { useMemo, useCallback } from 'react';
import RatioButton from './RatioButton';
import { useEditor } from '../EditorContext';
import CustomRatioCard from './CustomRatioCard';

export default function RatioSelector() {
  const { ratioOptions, ratioKey, setRatioKey, customSize } = useEditor();

  const presets = useMemo(
    () =>
      ratioOptions.filter((o) => Number.isFinite(o.w) && Number.isFinite(o.h)),
    [ratioOptions],
  );

  const customOption = useMemo(
    () => ratioOptions.find((o) => o.key === 'custom'),
    [ratioOptions],
  );

  const selectCustom = useCallback(() => setRatioKey('custom'), [setRatioKey]);

  return (
    <section className="rounded-xl text-neutral-200 p-2">
      <div className="grid grid-cols-4 gap-2">
        {presets.map((it) => (
          <RatioButton key={it.key} item={it} />
        ))}
      </div>

      {customOption && (
        <CustomRatioCard
          active={ratioKey === 'custom'}
          onSelect={selectCustom}
          value={customSize}
        />
      )}
    </section>
  );
}
