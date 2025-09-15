import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react';
import * as htmlToImage from 'html-to-image';

const EditorContext = createContext(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be inside EditorProvider');
  return ctx;
}

export function EditorProvider({ children }) {
  // ─── State ───────────────────────────────────────────────────────────
  const [screenshot, setScreenshot] = useState('');
  const originalRef = useRef(null);

  const [isCropping, setIsCropping] = useState(false);

  const [padding, setPadding] = useState(40);
  const [inset, setInset] = useState(20);
  const [shadow, setShadow] = useState(0);
  const [radius, setRadius] = useState(30);

  const [bgColorValue, setBgColorValue] = useState(
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
  );
  const [insetBgColor, setInsetBgColor] = useState('#fff');

  const [ratioKey, setRatioKey] = useState('1:1');
  const [customSize, setCustomSize] = useState({ w: 1024, h: 1024 });
  const [scaled, setScaled] = useState({ w: 0, h: 0 });
  const [displayScale, setDisplayScale] = useState(1);
  const [naturalImageSize, setNaturalImageSize] = useState({ w: 0, h: 0 });

  const sidebarRef = useRef(null);
  const wrapperRef = useRef(null);

  // ─── Constants ────────────────────────────────────────────────────────
  const ratioOptions = [
    { key: 'auto', label: 'Auto' },
    { key: '1:1', label: '1:1', w: 1024, h: 1024 },
    { key: '4:3', label: '4:3', w: 1024, h: 768 },
    { key: '3:2', label: '3:2', w: 1024, h: 682 },
    { key: '16:9', label: '16:9', w: 1280, h: 720 },
    { key: '9:16', label: '16:9', w: 720, h: 1280 },
    { key: 'Twitter', label: 'Twitter', w: 1200, h: 675 },
    { key: 'Facebook', label: 'Facebook', w: 1200, h: 628 },
    { key: 'Instagram', label: 'Instagram', w: 1080, h: 1080 },
    { key: 'LinkedIn', label: 'LinkedIn', w: 1200, h: 627 },
    { key: 'YouTube', label: 'YouTube', w: 1280, h: 720 },
    { key: 'Pinterest', label: 'Pinterest', w: 1000, h: 1500 },
    { key: 'Reddit', label: 'Reddit', w: 1200, h: 900 },
    { key: 'custom', label: 'Custom…' },
  ];
  const gradientPresets = [
    // Sunset vibes
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',

    // Ocean blues
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',

    // Purple dreams
    'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)',
    'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',

    // Tropical vibes
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',

    // Dark / neon
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'linear-gradient(135deg, #000428 0%, #004e92 100%)',

    // Fun & vibrant
    'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
    //
    // // 🔮 Radial gradients
    // 'radial-gradient(circle at center, #ff9a9e 0%, #fad0c4 100%)',
    // 'radial-gradient(circle at center, #a1c4fd 0%, #c2e9fb 100%)',
    // 'radial-gradient(circle at top left, #fbc2eb 0%, #a6c1ee 100%)',
    // 'radial-gradient(circle at bottom right, #ffecd2 0%, #fcb69f 100%)',
    // 'radial-gradient(circle at center, #667eea 0%, #764ba2 100%)',
    // 'radial-gradient(circle at center, #ff6a00 0%, #ee0979 100%)',
  ];

  // ─── Handlers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (url) => {
      setScreenshot(url);
      originalRef.current = url;
    };
    window.electronAPI.onScreenshotData(handler);
    return () => window.electronAPI.removeScreenshotListener?.(handler);
  }, []);

  const revert = useCallback(() => {
    if (originalRef.current) setScreenshot(originalRef.current);
    setIsCropping(false);
  }, []);

  const fileName = () => {
    const d = new Date(),
      z = (v) => String(v).padStart(2, '0');
    return `${z(d.getMonth() + 1)}-${z(d.getDate())}-${d.getFullYear()}_${z(d.getHours())}-${z(d.getMinutes())}-${z(d.getSeconds())}`;
  };

  const copyToClipboard = useCallback(async () => {
    const el = document.getElementById('captureArea');
    if (!el) return;
    try {
      // html-to-image supports pixelRatio → bump for HD
      const blob = await htmlToImage.toBlob(el, {
        backgroundColor: null,
        pixelRatio: window.devicePixelRatio * 2,
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const saveFile = useCallback(async () => {
    const el = document.getElementById('captureArea');
    if (!el) return;
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        backgroundColor: null,
        pixelRatio: window.devicePixelRatio * 2,
      });
      await window.electronAPI.saveComposedImage(dataUrl, `${fileName()}.png`);
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, []);

  // ─── Ratio / Display scaling ──────────────────────────────────────────────
  const chosen = ratioOptions.find((o) => o.key === ratioKey) || {};
  useLayoutEffect(() => {
    if (!chosen.w || !chosen.h) return;
    const container = wrapperRef.current;
    if (!container) return;
    const { clientWidth: pw, clientHeight: ph } = container;
    const scale = Math.min(pw / chosen.w, ph / chosen.h, 1);
    setScaled({ w: chosen.w * scale, h: chosen.h * scale });
    setDisplayScale(scale);
  }, [ratioKey, chosen.w, chosen.h]);

  // ─── Auto-detect inset background ─────────────────────────────────────────
  const imgRef = useRef(null);
  useEffect(() => {
    if (!screenshot || !imgRef.current) return;
    const img = imgRef.current;
    const run = () => {
      const w = img.naturalWidth,
        h = img.naturalHeight;

      setNaturalImageSize({ w, h });

      if (!w || !h) return;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', {
        willReadFrequently: true,
      });
      ctx.drawImage(img, 0, 0, w, h);
      const S = 5;
      let [r, g, b, cnt] = [0, 0, 0, 0];
      for (let [sx, sy] of [
        [0, 0],
        [w - S, 0],
        [0, h - S],
        [w - S, h - S],
      ]) {
        const data = ctx.getImageData(sx, sy, S, S).data;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          cnt++;
        }
      }
      setInsetBgColor(
        `rgb(${Math.round(r / cnt)},${Math.round(g / cnt)},${Math.round(b / cnt)})`,
      );
    };
    if (img.complete) run();
    else img.onload = run;
  }, [screenshot]);

  const onCrop = (c) => {
    setScreenshot(c);
    setIsCropping(false);
  };

  const openFromClipboard = useCallback(() => {
    window.electronAPI.openFromClipboard();
  }, []);

  const openFromFile = useCallback(() => {
    window.electronAPI.openFromFile();
  }, []);

  return (
    <EditorContext.Provider
      value={{
        sidebarRef,
        wrapperRef,
        screenshot,
        isCropping,
        setIsCropping,
        padding,
        setPadding,
        inset,
        setInset,
        shadow,
        setShadow,
        radius,
        setRadius,
        bgColorValue,
        setBgColorValue,
        insetBgColor,
        setInsetBgColor,
        ratioOptions,
        ratioKey,
        setRatioKey,
        customSize,
        setCustomSize,
        chosen,
        scaled,
        displayScale,
        gradientPresets,
        revert,
        copyToClipboard,
        saveFile,
        imgRef,
        onCrop,
        openFromClipboard,
        openFromFile,
        naturalImageSize,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
