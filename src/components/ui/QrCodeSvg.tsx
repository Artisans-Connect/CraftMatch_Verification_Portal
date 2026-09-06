import React, { useState } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
}

/**
 * QR Code Display Component
 * Renders a high-resolution QR code image for mobile camera scanning.
 * Uses PNG format for universal camera app & browser compatibility with automatic fallback.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 180,
  className = '',
  includeMargin = true,
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const encodedValue = encodeURIComponent(value);

  // Primary: QRServer (PNG format - 100% camera app & device compatible)
  const primaryQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=1&format=png`;

  // Fallback: QuickChart QR API
  const fallbackQrUrl = `https://quickchart.io/qr?text=${encodedValue}&size=${size}&margin=1`;

  const qrUrl = useFallback ? fallbackQrUrl : primaryQrUrl;

  return (
    <div
      className={`inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm border border-neutral-100 ${className}`}
      style={{ width: size + (includeMargin ? 16 : 0), height: size + (includeMargin ? 16 : 0) }}
    >
      <img
        src={qrUrl}
        alt="Scan QR code to download CraftMatch APK"
        width={size}
        height={size}
        className="rounded-xl object-contain"
        loading="eager"
        onError={() => {
          if (!useFallback) {
            setUseFallback(true);
          }
        }}
      />
    </div>
  );
};
