import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Decal, RoundedBox, useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

import swordsIcon from "./assets/icons/swords.svg";
import shieldIcon from "./assets/icons/shield.svg";
import sparklesIcon from "./assets/icons/sparkles.svg";
import shieldAlertIcon from "./assets/icons/shield-alert.svg";

type DiceResult =
  | "sword"
  | "sparkles"
  | "shield"
  | "shield-alert"
  | "blank";

type Props = {
  rollTrigger: number;
  position: [number, number, number];
  type: "attack" | "defense";
  index: number;
  total: number;
  result?: DiceResult;
  onResult: (index: number, result: DiceResult) => void;
};

function getResultRotation(result: DiceResult) {
  // หน้า Swords หรือ Shield
  if (result === "sword" || result === "shield") {
    return new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, 0, 0)
    );
  }

  // หน้า Sparkles หรือ Shield Alert
  if (result === "sparkles" || result === "shield-alert") {
    return new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.PI / 2, 0, 0)
    );
  }

  // หน้าว่าง
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-Math.PI / 2, 0, 0)
  );
}

export default function Dice({
  rollTrigger,
  position,
  type,
  index,
  total,
  result,
  onResult,
}: Props) {
  const diceRef = useRef<any>(null);

  const rolling = useRef(false);
  const arranging = useRef(false);
  const resultReported = useRef(false);
  const rollStartedAt = useRef(0);

  const targetPosition = useRef({
    x: 0,
    y: 0.55,
    z: 2.2,
  });

  const targetRotation = useRef(new THREE.Quaternion());

  const swordsTexture = useTexture(swordsIcon);
  const shieldTexture = useTexture(shieldIcon);
  const sparklesTexture = useTexture(sparklesIcon);
  const shieldAlertTexture = useTexture(shieldAlertIcon);

  const faceIcons =
    type === "attack"
      ? [
          swordsTexture,
          swordsTexture,
          swordsTexture,
          null,
          null,
          sparklesTexture,
        ]
      : [
          shieldTexture,
          shieldTexture,
          shieldTexture,
          null,
          null,
          shieldAlertTexture,
        ];

  const roll = () => {
    if (!diceRef.current || !result) return;

    rolling.current = true;
    arranging.current = false;
    resultReported.current = false;
    rollStartedAt.current = performance.now();

    diceRef.current.setTranslation(
      {
        x: position[0],
        y: position[1],
        z: position[2],
      },
      true
    );

    diceRef.current.setRotation(
      {
        x: 0,
        y: 0,
        z: 0,
        w: 1,
      },
      true
    );

    diceRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    diceRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    diceRef.current.wakeUp();

    diceRef.current.applyImpulse(
      {
        x: (Math.random() - 0.5) * 2,
        y: 6,
        z: (Math.random() - 0.5) * 2,
      },
      true
    );

    diceRef.current.applyTorqueImpulse(
      {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 5,
      },
      true
    );
  };

  useEffect(() => {
    roll();
  }, [rollTrigger]);

  useFrame(() => {
    if (!diceRef.current) return;

    /*
      หลังเริ่มทอยครบ 2.5 วินาที
      ให้ใช้ผลจาก Server แล้วเริ่มเรียงลูกเต๋า
    */
    if (
      rolling.current &&
      result &&
      performance.now() - rollStartedAt.current >= 2500
    ) {
      rolling.current = false;
      arranging.current = true;

      diceRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      diceRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      targetPosition.current = {
        x: (index - (total - 1) / 2) * 1.3,
        y: 0.55,
        z: 2.2,
      };

      targetRotation.current = getResultRotation(result);
    }

    /*
      เลื่อนและหมุนลูกเต๋าไปยังแถวผลลัพธ์
    */
    if (arranging.current) {
      const currentPosition = diceRef.current.translation();
      const currentRotation = diceRef.current.rotation();

      const nextPosition = {
        x:
          currentPosition.x +
          (targetPosition.current.x - currentPosition.x) * 0.1,

        y:
          currentPosition.y +
          (targetPosition.current.y - currentPosition.y) * 0.1,

        z:
          currentPosition.z +
          (targetPosition.current.z - currentPosition.z) * 0.1,
      };

      const currentQuaternion = new THREE.Quaternion(
        currentRotation.x,
        currentRotation.y,
        currentRotation.z,
        currentRotation.w
      );

      currentQuaternion.slerp(targetRotation.current, 0.12);

      diceRef.current.setTranslation(nextPosition, true);

      diceRef.current.setRotation(
        {
          x: currentQuaternion.x,
          y: currentQuaternion.y,
          z: currentQuaternion.z,
          w: currentQuaternion.w,
        },
        true
      );

      diceRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      diceRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

      const positionFinished =
        Math.abs(nextPosition.x - targetPosition.current.x) < 0.02 &&
        Math.abs(nextPosition.y - targetPosition.current.y) < 0.02 &&
        Math.abs(nextPosition.z - targetPosition.current.z) < 0.02;

      const rotationFinished =
        currentQuaternion.angleTo(targetRotation.current) < 0.02;

      if (positionFinished && rotationFinished) {
        diceRef.current.setTranslation(targetPosition.current, true);

        diceRef.current.setRotation(
          {
            x: targetRotation.current.x,
            y: targetRotation.current.y,
            z: targetRotation.current.z,
            w: targetRotation.current.w,
          },
          true
        );

        arranging.current = false;

        if (!resultReported.current && result) {
          resultReported.current = true;
          onResult(index, result);
        }
      }

      return;
    }

    /*
      จำกัดพื้นที่ขณะกำลังทอย
    */
    if (rolling.current) {
      const pos = diceRef.current.translation();

      const limitX = 5.8;
      const limitZ = 4.8;

      let changed = false;

      if (pos.x > limitX) {
        pos.x = limitX;
        changed = true;
      }

      if (pos.x < -limitX) {
        pos.x = -limitX;
        changed = true;
      }

      if (pos.z > limitZ) {
        pos.z = limitZ;
        changed = true;
      }

      if (pos.z < -limitZ) {
        pos.z = -limitZ;
        changed = true;
      }

      if (changed) {
        diceRef.current.setTranslation(pos, true);

        const velocity = diceRef.current.linvel();

        diceRef.current.setLinvel(
          {
            x: velocity.x * -0.3,
            y: velocity.y,
            z: velocity.z * -0.3,
          },
          true
        );
      }
    }
  });

  return (
    <RigidBody
      ref={diceRef}
      position={position}
      colliders="cuboid"
      restitution={0.4}
      friction={0.8}
    >
      <RoundedBox
        args={[1, 1, 1]}
        radius={0.08}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial
          color={type === "attack" ? "#d32f2f" : "#1976d2"}
        />

        {faceIcons[0] && (
          <Decal
            position={[0.51, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={0.55}
            map={faceIcons[0]}
          />
        )}

        {faceIcons[1] && (
          <Decal
            position={[-0.51, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={0.55}
            map={faceIcons[1]}
          />
        )}

        {faceIcons[2] && (
          <Decal
            position={[0, 0.51, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={0.55}
            map={faceIcons[2]}
          />
        )}

        {faceIcons[5] && (
          <Decal
            position={[0, 0, -0.51]}
            rotation={[0, Math.PI, 0]}
            scale={0.55}
            map={faceIcons[5]}
          />
        )}
      </RoundedBox>
    </RigidBody>
  );
}