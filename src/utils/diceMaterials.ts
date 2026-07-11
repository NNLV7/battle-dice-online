import * as THREE from "three";

import swords from "../assets/icons/swords.svg";
import shield from "../assets/icons/shield.svg";
import sparkles from "../assets/icons/sparkles.svg";
import shieldAlert from "../assets/icons/shield-alert.svg";

const loader = new THREE.TextureLoader();

function makeMaterial(color: string, icon?: string) {
  if (!icon) {
    return new THREE.MeshStandardMaterial({
      color,
    });
  }

  const texture = loader.load(icon);

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return new THREE.MeshStandardMaterial({
    color,
    map: texture,
  });
}

export function getDiceMaterials(type: "attack" | "defense") {
  if (type === "attack") {
    return [
      // หน้า 1
      makeMaterial("#d32f2f", swords),

      // หน้า 2
      makeMaterial("#d32f2f", swords),

      // หน้า 3
      makeMaterial("#d32f2f", swords),

      // หน้า 4
      makeMaterial("#d32f2f"),

      // หน้า 5
      makeMaterial("#d32f2f"),

      // หน้า 6
      makeMaterial("#d32f2f", sparkles),
    ];
  }

  return [
    // หน้า 1
    makeMaterial("#1976d2", shield),

    // หน้า 2
    makeMaterial("#1976d2", shield),

    // หน้า 3
    makeMaterial("#1976d2", shield),

    // หน้า 4
    makeMaterial("#1976d2"),

    // หน้า 5
    makeMaterial("#1976d2"),

    // หน้า 6
    makeMaterial("#1976d2", shieldAlert),
  ];
}