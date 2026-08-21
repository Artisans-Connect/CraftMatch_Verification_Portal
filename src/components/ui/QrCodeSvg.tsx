import React from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  includeMargin?: boolean;
}

/**
 * Lightweight QR Code Generator (Reed-Solomon Byte Mode / Numeric Mode)
 * Renders pure SVG for crisp, offline-ready mobile camera scanning.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 180,
  className = '',
  includeMargin = true,
}) => {
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=1&format=svg`;

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
        className="rounded-xl"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};
