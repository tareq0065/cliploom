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

// Helpers
function parseRgbString(s, fallback = [255, 255, 255]) {
  if (!s) return fallback;
  if (s.startsWith('rgb')) {
    const m = s.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
  }
  if (s[0] === '#') {
    const hex = s.slice(1);
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }
  return fallback;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(
    a.length - 1,
    Math.max(0, Math.floor((p / 100) * (a.length - 1))),
  );
  return a[idx];
}

export function EditorProvider({ children }) {
  // State
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

  const [autoBalance, setAutoBalance] = useState(false);
  const [imageOffsetX, setImageOffsetX] = useState(0);
  const [imageOffsetY, setImageOffsetY] = useState(0);

  const sidebarRef = useRef(null);
  const wrapperRef = useRef(null);
  const imgRef = useRef(null);

  // Constants
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
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
    'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)',
    'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    'linear-gradient(135deg, #ff6a00 0%, #ee0979 100%)',
  ];

  // Handlers
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
    const d = new Date();
    const z = (v) => String(v).padStart(2, '0');
    return `${z(d.getMonth() + 1)}-${z(d.getDate())}-${d.getFullYear()}_${z(
      d.getHours(),
    )}-${z(d.getMinutes())}-${z(d.getSeconds())}`;
  };

  const copyToClipboard = useCallback(async () => {
    const el = document.getElementById('captureArea');
    if (!el) return;
    try {
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

  // Ratio / scaling
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

  // Auto-detect inset background
  useEffect(() => {
    if (!screenshot || !imgRef.current) return;
    const img = imgRef.current;
    const run = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      setNaturalImageSize({ w, h });
      if (!w || !h) return;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true });
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
        `rgb(${Math.round(r / cnt)},${Math.round(g / cnt)},${Math.round(
          b / cnt,
        )})`,
      );
    };
    if (img.complete) run();
    else img.onload = run;
  }, [screenshot]);

  // Auto-balance (horizontal) — display-aware + robust
  const computeAutoBalance = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const dispW = Math.max(1, Math.round(rect.width));
    const dispH = Math.max(1, Math.round(rect.height));

    const downW = Math.min(640, Math.max(80, dispW));
    const scale = downW / dispW;
    const downH = Math.max(1, Math.round(dispH * scale));

    const c = document.createElement('canvas');
    c.width = downW;
    c.height = downH;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, downW, downH);
    const buf = ctx.getImageData(0, 0, downW, downH).data;

    const [bgR, bgG, bgB] = parseRgbString(insetBgColor, [255, 255, 255]);
    const idx = (x, y) => (y * downW + x) * 4;
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

    const edgeSamples = [];
    const colorSamples = [];

    for (let y = 0; y < downH; y += 2) {
      for (let x = 0; x < downW; x += 2) {
        const i = idx(x, y);
        const r = buf[i],
          g = buf[i + 1],
          b = buf[i + 2];
        const dR = r - bgR,
          dG = g - bgG,
          dB = b - bgB;
        const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);

        const x1 = clamp(x + 1, 0, downW - 1);
        const y1 = clamp(y + 1, 0, downH - 1);
        const jx = idx(x1, y),
          jy = idx(x, y1);
        const rX = buf[jx],
          gX = buf[jx + 1],
          bX = buf[jx + 2];
        const rY = buf[jy],
          gY = buf[jy + 1],
          bY = buf[jy + 2];

        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const Yx = 0.299 * rX + 0.587 * gX + 0.114 * bX;
        const Yy = 0.299 * rY + 0.587 * gY + 0.114 * bY;
        const edgeMag = Math.abs(Yx - Y) + Math.abs(Yy - Y);

        edgeSamples.push(edgeMag);
        colorSamples.push(colorDist);
      }
    }

    const e50 = percentile(edgeSamples, 50);
    const e95 = Math.max(e50 + 1e-6, percentile(edgeSamples, 95));
    const c50 = percentile(colorSamples, 50);
    const c95 = Math.max(c50 + 1e-6, percentile(colorSamples, 95));

    const colEnergy = new Float32Array(downW);
    const rowEnergy = new Float32Array(downH);
    const wEdge = 0.7; // heavier for vertical
    const wColor = 0.3;

    for (let y = 0; y < downH; y++) {
      for (let x = 0; x < downW; x++) {
        const i = idx(x, y);
        const r = buf[i],
          g = buf[i + 1],
          b = buf[i + 2];
        const dR = r - bgR,
          dG = g - bgG,
          dB = b - bgB;
        const colorDist = Math.sqrt(dR * dR + dG * dG + dB * dB);

        const x1 = clamp(x + 1, 0, downW - 1);
        const y1 = clamp(y + 1, 0, downH - 1);
        const jx = idx(x1, y),
          jy = idx(x, y1);
        const rX = buf[jx],
          gX = buf[jx + 1],
          bX = buf[jx + 2];
        const rY = buf[jy],
          gY = buf[jy + 1],
          bY = buf[jy + 2];

        const Y = 0.299 * r + 0.587 * g + 0.114 * b;
        const Yx = 0.299 * rX + 0.587 * gX + 0.114 * bX;
        const Yy = 0.299 * rY + 0.587 * gY + 0.114 * bY;
        const edgeMag = Math.abs(Yx - Y) + Math.abs(Yy - Y);

        const edgeN = clamp((edgeMag - e50) / (e95 - e50), 0, 1);
        const colorN = clamp((colorDist - c50) / (c95 - c50), 0, 1);
        const energy = wEdge * edgeN + wColor * colorN;

        colEnergy[x] += energy;
        rowEnergy[y] += energy;
      }
    }

    // Smooth profiles
    const smooth = (arr, k) => {
      const out = new Float32Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        let s = 0,
          n = 0;
        for (let t = -k; t <= k; t++) {
          const j = clamp(i + t, 0, arr.length - 1);
          s += arr[j];
          n++;
        }
        out[i] = s / n;
      }
      return out;
    };
    const colS = smooth(colEnergy, 4);
    const rowS = smooth(rowEnergy, 4);

    // Horizontal centroid
    let sumX = 0,
      momentX = 0;
    for (let x = 0; x < downW; x++) {
      sumX += colS[x];
      momentX += colS[x] * x;
    }
    if (sumX > 0) {
      const cx_disp = (momentX / sumX / downW) * dispW;
      const dx = Math.round(dispW / 2 - cx_disp);
      const maxShiftX = Math.round(dispW * 0.25);
      setImageOffsetX(Math.max(-maxShiftX, Math.min(maxShiftX, dx)));
    } else {
      setImageOffsetX(0);
    }

    // Vertical centroid (ignore 10% top/bottom margins to avoid gradient bias)
    let sumY = 0,
      momentY = 0;
    const yMin = Math.round(downH * 0.1);
    const yMax = Math.round(downH * 0.9);
    for (let y = yMin; y < yMax; y++) {
      sumY += rowS[y];
      momentY += rowS[y] * y;
    }
    if (sumY > 0) {
      const cy_disp = (momentY / sumY / downH) * dispH;
      const dy = Math.round(dispH / 2 - cy_disp);
      const maxShiftY = Math.round(dispH * 0.25);
      setImageOffsetY(Math.max(-maxShiftY, Math.min(maxShiftY, dy)));
    } else {
      setImageOffsetY(0);
    }
  }, [insetBgColor]);

  // re-run on layout/image changes
  useEffect(() => {
    if (!autoBalance) {
      setImageOffsetX(0);
      setImageOffsetY(0);
      return;
    }
    const id = requestAnimationFrame(() => computeAutoBalance());
    return () => cancelAnimationFrame(id);
  }, [
    autoBalance,
    screenshot,
    ratioKey,
    customSize,
    scaled,
    padding,
    inset,
    insetBgColor,
    computeAutoBalance,
  ]);

  // also watch actual element resizes
  useEffect(() => {
    if (!autoBalance) return;
    const img = imgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(() => computeAutoBalance());
    ro.observe(img);
    return () => ro.disconnect();
  }, [autoBalance, computeAutoBalance]);

  return (
    <EditorContext.Provider
      value={{
        sidebarRef,
        wrapperRef,
        screenshot,
        setScreenshot,
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
        naturalImageSize,
        // auto balance
        autoBalance,
        setAutoBalance,
        imageOffsetX,
        imageOffsetY,
        computeAutoBalance,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}
