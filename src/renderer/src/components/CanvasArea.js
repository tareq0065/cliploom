'use client';

import React, {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import { useEditor } from './EditorContext';

export default function CanvasArea() {
  const parentRef = useRef(null);
  const [scaled, setScaled] = useState({ w: 0, h: 0 });

  const {
    screenshot,
    imgRef,
    chosen,
    customSize,
    padding,
    inset,
    radius,
    insetBgColor,
    bgColorValue,
    shadow,
    naturalImageSize,
  } = useEditor();

  const parsePx = (v) =>
    typeof v === 'string' ? parseFloat(v) || 0 : Number(v) || 0;

  const computeAvailable = () => {
    const parent = parentRef.current;
    if (!parent) return { aw: 0, ah: 0 };

    const cs = getComputedStyle(parent);
    const padX = parsePx(cs.paddingLeft) + parsePx(cs.paddingRight);
    const padY = parsePx(cs.paddingTop) + parsePx(cs.paddingBottom);

    // Keep shadow purely visual; don’t subtract it from fit math
    return {
      aw: Math.max(0, parent.clientWidth - padX),
      ah: Math.max(0, parent.clientHeight - padY),
    };
  };

  const recalc = () => {
    let targetW, targetH;
    if (chosen?.key === 'custom' && customSize?.w && customSize?.h) {
      targetW = customSize.w;
      targetH = customSize.h;
    } else if (chosen?.w && chosen?.h) {
      targetW = chosen.w;
      targetH = chosen.h;
    } else if (naturalImageSize?.w && naturalImageSize?.h) {
      targetW = naturalImageSize.w;
      targetH = naturalImageSize.h;
    } else {
      return;
    }

    const { aw, ah } = computeAvailable();
    if (aw <= 0 || ah <= 0) return;

    const ratio = targetW / targetH;
    const fitW = Math.min(aw, ah * ratio);
    const fitH = fitW / ratio;
    const scale = Math.min(1, fitW / targetW, fitH / targetH);

    setScaled({
      w: Math.round(targetW * scale),
      h: Math.round(targetH * scale),
    });
  };

  useLayoutEffect(() => {
    recalc();
  }, [chosen, customSize, naturalImageSize, padding]);

  useEffect(() => {
    if (!parentRef.current) return;
    const ro = new ResizeObserver(() => recalc());
    ro.observe(parentRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => recalc();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Frame (scaled)
  const frameStyle = {
    width: `${scaled.w}px`,
    height: `${scaled.h}px`,
    padding: `${padding}px`,
    background: bgColorValue ?? 'transparent',
    boxSizing: 'border-box',
    overflow: 'hidden', // allow shadow to render
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Compute the image's fitted size inside the frame's content box
  const { containerW, containerH } = useMemo(() => {
    const contentW = Math.max(0, scaled.w - padding * 2);
    const contentH = Math.max(0, scaled.h - padding * 2);

    // Base (natural) image ratio; fall back to the chosen/custom ratio if needed
    const baseW =
      naturalImageSize?.w ||
      (chosen?.key === 'custom' ? customSize?.w : chosen?.w) ||
      1;
    const baseH =
      naturalImageSize?.h ||
      (chosen?.key === 'custom' ? customSize?.h : chosen?.h) ||
      1;

    const aspect = baseW / baseH;

    // Fit the image into content area (this is the image’s visible size)
    let imgW = contentW;
    let imgH = imgW / aspect;
    if (imgH > contentH) {
      imgH = contentH;
      imgW = imgH * aspect;
    }

    // If you want "inset" to show as inner padding, container includes it
    const w = Math.max(0, Math.round(imgW + inset * 2));
    const h = Math.max(0, Math.round(imgH + inset * 2));
    return { containerW: w, containerH: h };
  }, [
    scaled.w,
    scaled.h,
    padding,
    inset,
    naturalImageSize,
    chosen,
    customSize,
  ]);

  // Image container shrink-wraps to the fitted image (plus inset padding)
  const imageContainerStyle = {
    width: `${containerW}px`,
    height: `${containerH}px`,
    borderRadius: `${radius}px`,
    boxShadow: `0px 20px 53px ${shadow}px rgba(0,0,0,0.55)`,
    padding: `${inset}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: insetBgColor,
  };

  // Image fills the container's inner content box exactly
  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
  };

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative flex justify-center items-start pt-4"
    >
      {screenshot && (
        <div style={frameStyle} id="captureArea">
          <div style={imageContainerStyle}>
            <img
              ref={imgRef}
              src={screenshot}
              alt="Screenshot"
              style={imgStyle}
            />
          </div>
        </div>
      )}

      {!screenshot && (
        <div className="text-gray-500 absolute inset-0 flex items-center justify-center">
          Waiting for screenshot…
        </div>
      )}
    </div>
  );
}
