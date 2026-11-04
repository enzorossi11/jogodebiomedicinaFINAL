/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Utilitários de Estúdio Three.js (r160+)
 * Inclui detecção segura de Software WebGL, cadenciamento de frames afterDraw,
 * sombra de contato procedural radial e anéis de plataforma sem arquivos externos.
 */

import * as THREE from 'three';

export function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function scheduleAfterDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  timerRef: { id: number }
) {
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (gl && typeof gl.fenceSync === 'function') {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        timerRef.id = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        timerRef.id = window.setTimeout(cb, 80);
      }
    };
    timerRef.id = window.setTimeout(poll, 5);
  } else {
    timerRef.id = window.setTimeout(cb, 80);
  }
}

export function createRadialContactShadowTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.34)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export function createStudioFloorDialTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;

    ctx.strokeStyle = 'rgba(13, 148, 136, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 220, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 165, 0, Math.PI * 2);
    ctx.stroke();

    // Marcas sutis de bússola espacial (24 divisões)
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const r1 = i % 6 === 0 ? 204 : 212;
      const r2 = 224;
      ctx.strokeStyle = i % 6 === 0 ? 'rgba(13, 148, 136, 0.4)' : 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = i % 6 === 0 ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}
