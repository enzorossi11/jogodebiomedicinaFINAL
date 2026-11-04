/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Biblioteca de Assets 16-Bit (Miniaturas Recortadas dos Assets Enviados + Ícones dos Órgãos)
 */

import React, { useEffect, useRef } from 'react';
import { getCutoutSpriteCanvas, UPLOADED_16BIT_ASSETS } from './three/pixelAssetLoader';

interface PixelAssetProps {
  className?: string;
  size?: number;
  bitten?: boolean;
}

/**
 * Renderiza em um <canvas> 2D nítido qualquer um dos assets 16-bit enviados já com fundo transparente!
 */
export const CutoutAssetThumb: React.FC<{
  src: string;
  alt: string;
  size?: number;
  className?: string;
}> = ({ src, alt, size = 48, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    getCutoutSpriteCanvas(src, 128)
      .then((cutout) => {
        if (!active || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(cutout, 0, 0, canvasRef.current.width, canvasRef.current.height);
      })
      .catch(() => {
        // Silencioso: fallback visual mantido
      });
    return () => {
      active = false;
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={128}
      aria-label={alt}
      role="img"
      style={{ width: size, height: size, imageRendering: 'pixelated' }}
      className={`shrink-0 ${className}`}
    />
  );
};

// 1. Maçã 16-Bit (usando o asset oficial enviado recortado)
export const PixelApple: React.FC<PixelAssetProps> = ({ size = 56, className = '' }) => (
  <CutoutAssetThumb
    src={UPLOADED_16BIT_ASSETS.apple}
    alt="Maçã em pixel art 16-bit"
    size={size}
    className={className}
  />
);

// 2. Pão Fatiado 16-Bit (usando o asset oficial enviado recortado)
export const PixelBread: React.FC<PixelAssetProps> = ({ size = 56, className = '' }) => (
  <CutoutAssetThumb
    src={UPLOADED_16BIT_ASSETS.bread}
    alt="Pão fatiado em pixel art 16-bit"
    size={size}
    className={className}
  />
);

// 3. Cenoura 16-Bit (usando o asset oficial enviado recortado)
export const PixelCarrot: React.FC<PixelAssetProps> = ({ size = 56, className = '' }) => (
  <CutoutAssetThumb
    src={UPLOADED_16BIT_ASSETS.carrot}
    alt="Cenoura em pixel art 16-bit"
    size={size}
    className={className}
  />
);

// 4. Ovo Cozido Nutritivo 16-Bit (Rico em Proteínas conforme o PDF)
export const PixelEgg: React.FC<PixelAssetProps> = ({ size = 56, className = '', bitten = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    style={{ shapeRendering: 'crispEdges' }}
    className={`shrink-0 ${className}`}
    aria-label="Ovo em pixel art 16-bit"
  >
    <rect x="6" y="1" width="4" height="1" fill="#1E1B2E" />
    <rect x="4" y="2" width="2" height="2" fill="#1E1B2E" />
    <rect x="10" y="2" width="2" height="2" fill="#1E1B2E" />
    <rect x="3" y="4" width="1" height="7" fill="#1E1B2E" />
    <rect x="12" y="4" width="1" height="7" fill="#1E1B2E" />
    <rect x="4" y="11" width="2" height="2" fill="#1E1B2E" />
    <rect x="10" y="11" width="2" height="2" fill="#1E1B2E" />
    <rect x="6" y="13" width="4" height="1" fill="#1E1B2E" />

    <rect x="6" y="2" width="4" height="11" fill="#FFFFFF" />
    <rect x="4" y="4" width="8" height="7" fill="#FFFFFF" />
    <rect x="5" y="3" width="6" height="9" fill="#F8FAFC" />
    <rect x="10" y="5" width="2" height="5" fill="#CBD5E1" />

    <rect x="6" y="6" width="4" height="4" fill="#F59E0B" />
    <rect x="5" y="7" width="6" height="2" fill="#FBBF24" />
    <rect x="6" y="7" width="2" height="1" fill="#FEF3C7" />

    {bitten && (
      <g>
        <rect x="2" y="3" width="4" height="5" fill="#F8FAFC" />
        <rect x="5" y="4" width="1" height="4" fill="#94A3B8" />
      </g>
    )}
  </svg>
);

// 5. Gota 16-Bit (usando o asset oficial enviado recortado)
export const PixelDrop: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className = ''
}) => (
  <CutoutAssetThumb
    src={UPLOADED_16BIT_ASSETS.drop}
    alt="Gota em pixel art 16-bit"
    size={size}
    className={className}
  />
);

// 6. Tubo Esofágico 16-Bit (usando o asset oficial enviado recortado)
export const PixelEsophagusThumb: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = ''
}) => (
  <CutoutAssetThumb
    src={UPLOADED_16BIT_ASSETS.esophagusTube}
    alt="Esôfago em pixel art 16-bit"
    size={size}
    className={className}
  />
);

// 7. Ícones Miniaturas para a Barra de Progresso dos Órgãos
export const OrganMiniIcons = {
  food: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="3" y="3" width="10" height="10" fill="#EF4444" />
      <rect x="7" y="1" width="2" height="2" fill="#15803D" />
      <rect x="5" y="5" width="3" height="3" fill="#FCA5A5" />
    </svg>
  ),
  mouth: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="2" y="6" width="12" height="4" fill="#F43F5E" />
      <rect x="4" y="6" width="3" height="3" fill="#FFFFFF" />
      <rect x="9" y="6" width="3" height="3" fill="#FFFFFF" />
    </svg>
  ),
  throat: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="5" y="2" width="6" height="12" fill="#6366F1" />
      <rect x="7" y="6" width="2" height="4" fill="#E11D48" />
    </svg>
  ),
  esophagus: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="6" y="1" width="4" height="14" fill="#E11D48" />
      <rect x="7" y="3" width="2" height="2" fill="#FDA4AF" />
      <rect x="7" y="7" width="2" height="2" fill="#FDA4AF" />
      <rect x="7" y="11" width="2" height="2" fill="#FDA4AF" />
    </svg>
  ),
  stomach: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="4" y="4" width="8" height="8" fill="#0284C7" />
      <rect x="5" y="5" width="6" height="6" fill="#7DD3FC" />
      <rect x="7" y="2" width="3" height="2" fill="#0369A1" />
    </svg>
  ),
  smallIntestine: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="2" y="3" width="12" height="2" fill="#16A34A" />
      <rect x="2" y="7" width="12" height="2" fill="#22C55E" />
      <rect x="2" y="11" width="12" height="2" fill="#16A34A" />
      <rect x="6" y="4" width="4" height="4" fill="#BBF7D0" />
    </svg>
  ),
  largeIntestine: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="2" y="2" width="12" height="3" fill="#DB2777" />
      <rect x="2" y="5" width="3" height="8" fill="#DB2777" />
      <rect x="11" y="5" width="3" height="8" fill="#DB2777" />
      <rect x="5" y="8" width="6" height="4" fill="#FCE7F3" />
    </svg>
  ),
  ordering: (
    <svg width="18" height="18" viewBox="0 0 16 16" style={{ shapeRendering: 'crispEdges' }}>
      <rect x="2" y="2" width="5" height="5" fill="#0D9488" />
      <rect x="9" y="2" width="5" height="5" fill="#14B8A6" />
      <rect x="2" y="9" width="5" height="5" fill="#14B8A6" />
      <rect x="9" y="9" width="5" height="5" fill="#0D9488" />
    </svg>
  )
};
