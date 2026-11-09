/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Estação 3: mouth (Cavidade Bucal 3D: Arcadas Dentárias + Saliva 16-Bit)
 */

import * as THREE from 'three';
import { LoadedHD2DAssetPack } from '../pixelAssetLoader';
import { Proposta1HD2DSceneProps } from '../Proposta1HD2DScene3D';
import { StationBuildContext, StationInstance } from './types';

export function createMouthStation(ctx: StationBuildContext): StationInstance {
  const group = new THREE.Group();

  const upperArchGroup = new THREE.Group();
  upperArchGroup.position.set(0, 1.26, 0);
  group.add(upperArchGroup);

  const lowerArchGroup = new THREE.Group();
  lowerArchGroup.position.set(0, 0.64, 0);
  group.add(lowerArchGroup);

  const gumArchGeo = ctx.trackGeo(new THREE.TorusGeometry(0.46, 0.085, 16, 36, Math.PI));
  const upperGum = new THREE.Mesh(gumArchGeo, ctx.sharedMaterials.mucosaPinkMat);
  upperGum.rotation.x = Math.PI / 2;
  upperGum.rotation.z = Math.PI;
  upperArchGroup.add(upperGum);

  const lowerGum = new THREE.Mesh(gumArchGeo, ctx.sharedMaterials.mucosaPinkMat);
  lowerGum.rotation.x = Math.PI / 2;
  lowerGum.rotation.z = Math.PI;
  lowerArchGroup.add(lowerGum);

  // Língua 3D macia
  const tongueMesh = new THREE.Mesh(
    ctx.trackGeo(new THREE.CapsuleGeometry(0.22, 0.26, 12, 24)).rotateX(Math.PI / 2),
    ctx.sharedMaterials.mucosaDeepMat
  );
  tongueMesh.scale.set(1.15, 0.45, 1);
  tongueMesh.position.set(0, 0.02, -0.05);
  lowerArchGroup.add(tongueMesh);

  // 6 Dentes superiores e 6 inferiores chanfrados
  const molarGeo = ctx.trackGeo(new THREE.BoxGeometry(0.11, 0.14, 0.11));
  for (let i = 0; i < 6; i++) {
    const ang = Math.PI * (0.15 + (i / 5) * 0.7);
    const tx = Math.cos(ang) * 0.44;
    const tz = Math.sin(ang) * 0.36 - 0.1;

    const uTooth = new THREE.Mesh(molarGeo, ctx.sharedMaterials.toothEnamelMat);
    uTooth.position.set(tx, -0.09, tz);
    uTooth.castShadow = true;
    upperArchGroup.add(uTooth);

    const lTooth = new THREE.Mesh(molarGeo, ctx.sharedMaterials.toothEnamelMat);
    lTooth.position.set(tx, 0.09, tz);
    lTooth.castShadow = true;
    lowerArchGroup.add(lTooth);
  }

  // Alimento central sendo triturado + Bolo alimentar formado
  const { mesh: mouthFoodSprite, mat: mouthFoodMat } = ctx.createHD2DSpritePlane(0.5);
  mouthFoodSprite.position.set(0, 0.95, 0.06);
  group.add(mouthFoodSprite);

  const mouthChunksGroup = new THREE.Group();
  mouthChunksGroup.position.set(0, 0.94, 0.06);
  group.add(mouthChunksGroup);
  const chunkMeshes: THREE.Mesh[] = [];
  for (let c = 0; c < 5; c++) {
    const chunk = new THREE.Mesh(
      ctx.trackGeo(new THREE.DodecahedronGeometry(0.085, 1)),
      ctx.sharedMaterials.bolusGoldMat
    );
    chunk.position.set((c - 2) * 0.09, (c % 2) * 0.06 - 0.03, ((c % 3) - 1) * 0.05);
    mouthChunksGroup.add(chunk);
    chunkMeshes.push(chunk);
  }

  const mouthBolusSphere = new THREE.Mesh(
    ctx.trackGeo(new THREE.SphereGeometry(0.17, 24, 24)),
    ctx.sharedMaterials.bolusGoldMat
  );
  mouthBolusSphere.position.set(0, 0.94, 0.06);
  group.add(mouthBolusSphere);

  // 3 Gotas de Saliva 16-Bit flutuando acima da boca
  const mouthSalivaSprites: THREE.Mesh[] = [];
  const mouthSalivaMats: THREE.MeshBasicMaterial[] = [];
  [-0.28, 0, 0.28].forEach((sx, idx) => {
    const { mesh, mat } = ctx.createHD2DSpritePlane(0.24);
    mesh.position.set(sx, 1.52 + (idx === 1 ? 0.06 : 0), 0.14);
    group.add(mesh);
    mouthSalivaSprites.push(mesh);
    mouthSalivaMats.push(mat);

    // Hit proxy ampliado para facilidade motora
    const dropProxy = new THREE.Mesh(
      ctx.trackGeo(new THREE.SphereGeometry(0.18, 12, 12)),
      ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
    );
    dropProxy.position.copy(mesh.position);
    group.add(dropProxy);
    ctx.registerInteractive(dropProxy, 'mouth', 'Adicionar gota de saliva 16-bit', 'add_saliva');
  });

  const teethProxy = new THREE.Mesh(
    ctx.trackGeo(new THREE.BoxGeometry(1.2, 0.85, 0.85)),
    ctx.trackMat(new THREE.MeshBasicMaterial({ visible: false }))
  );
  teethProxy.position.set(0, 0.95, 0);
  group.add(teethProxy);
  ctx.registerInteractive(teethProxy, 'mouth', 'Mastigar alimento com os dentes 3D', 'chew_mouth');

  const applyAssets = (pack: LoadedHD2DAssetPack) => {
    mouthSalivaMats.forEach((m) => {
      m.map = pack.drops.saliva;
      m.needsUpdate = true;
    });
  };

  const update = (
    cur: Proposta1HD2DSceneProps,
    dt: number,
    simTime: number,
    assetPack: LoadedHD2DAssetPack | null
  ) => {
    // Sincroniza textura do alimento
    if (assetPack) {
      const chosenPack = assetPack.foods[cur.selectedFoodId];
      if (mouthFoodMat.map !== chosenPack.bitten) {
        mouthFoodMat.map = chosenPack.bitten;
        mouthFoodMat.needsUpdate = true;
      }
    }

    const isStageDone = cur.chewCount >= 3 && cur.salivaAdded;
    mouthFoodSprite.visible = cur.chewCount === 0 && !isStageDone;
    mouthChunksGroup.visible = cur.chewCount > 0 && !isStageDone;
    mouthBolusSphere.visible = isStageDone;

    const chewOsc = !isStageDone && cur.chewCount > 0 ? Math.sin(simTime * 3.0) * 0.035 : 0;
    upperArchGroup.position.y = 1.24 - Math.abs(chewOsc);
    lowerArchGroup.position.y = 0.66 + Math.abs(chewOsc);

    chunkMeshes.forEach((cm, idx) => {
      const s = Math.max(0.55, 1.15 - cur.chewCount * 0.2);
      cm.scale.setScalar(s);
      cm.rotation.y = simTime * 0.5 + idx;
    });

    mouthSalivaSprites.forEach((sp, idx) => {
      const targetY = cur.salivaAdded
        ? 0.96
        : 1.5 + (idx === 1 ? 0.06 : 0) + Math.sin(simTime * 1.8 + idx) * 0.025;
      const targetScale = cur.salivaAdded ? 0.01 : 0.24;
      sp.position.y = THREE.MathUtils.damp(sp.position.y, targetY, 4.5, dt);
      const sc = THREE.MathUtils.damp(sp.scale.x, targetScale, 5, dt);
      sp.scale.set(sc, sc, 1);
      sp.visible = sc > 0.03;
    });
  };

  return {
    group,
    applyAssets,
    update
  };
}
