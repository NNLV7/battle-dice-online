import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";
import Dice from "./Dice";

type DiceResult =
  | "sword"
  | "sparkles"
  | "shield"
  | "shield-alert"
  | "blank";

type Props = {
  rollTrigger: number;
  attackDice: number;
  defenseDice: number;
  rollType: "attack" | "defense";
  results: DiceResult[];
  onResult: (index: number, result: DiceResult) => void;
};

function DiceScene({
  rollTrigger,
  attackDice,
  defenseDice,
  rollType,
  results,
  onResult,
}: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 15, 8], fov: 45 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.5} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
        castShadow
      />

      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, -0.5, 0]} receiveShadow>
            <boxGeometry args={[20, 1, 20]} />
            <meshStandardMaterial color="#2e8b57" />
          </mesh>
        </RigidBody>

        {rollType === "attack" &&
          Array.from({ length: attackDice }).map((_, i) => (
            <Dice
              key={`atk-${i}`}
              rollTrigger={rollTrigger}
              position={[
                (i - (attackDice - 1) / 2) * 1.3,
                3,
                0,
              ]}
              type="attack"
              index={i}
              total={attackDice}
              result={results[i]}
              onResult={onResult}
            />
          ))}

        {rollType === "defense" &&
          Array.from({ length: defenseDice }).map((_, i) => (
            <Dice
              key={`def-${i}`}
              rollTrigger={rollTrigger}
              position={[
                (i - (defenseDice - 1) / 2) * 1.3,
                3,
                0,
              ]}
              type="defense"
              index={i}
              total={defenseDice}
              result={results[i]}
              onResult={onResult}
            />
          ))}
      </Physics>

      <OrbitControls />
    </Canvas>
  );
}

export default DiceScene;