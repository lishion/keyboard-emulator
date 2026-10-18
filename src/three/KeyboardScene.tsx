import { Suspense, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, Line, OrbitControls } from '@react-three/drei';
import { MM } from '../config/constants';
import { THEMES } from '../config/themes';
import { HERO_STEP_INDEX } from '../data/steps';
import { useAppStore } from '../state/store';
import { director } from '../state/director';
import { CameraRig } from './CameraRig';
import { Keycaps } from './parts/Keycaps';
import { SwitchField } from './parts/SwitchField';
import { Stabilizers } from './parts/Stabilizers';
import {
  BottomFoam,
  CaseLower,
  CaseScrews,
  CaseUpper,
  Feet,
  Gaskets,
  Pcb,
  Plate,
  SandwichFoam,
  UsbModule,
} from './parts/BoardParts';
import { HeroSwitch } from './parts/HeroSwitch';
import { KeyGlow } from './parts/KeyGlow';
import { Labels } from './overlays/Labels';

function FrameDriver() {
  useFrame((_, delta) => {
    director.update(delta);
  });
  return null;
}

function ReadySignal() {
  const setLoading = useAppStore((state) => state.setLoading);
  useFrame(() => {
    if (useAppStore.getState().loading) setLoading(false);
  });
  return null;
}

function LayerGuides({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const xs = [-196, 196];
  const zs = [-78, 78];
  return (
    <group>
      {xs.map((x) =>
        zs.map((z) => (
          <Line
            key={`${x}-${z}`}
            points={[
              [x, -2, z],
              [x, 224, z],
            ]}
            color="#e87432"
            lineWidth={0.7}
            dashed
            dashSize={4}
            gapSize={5}
            transparent
            opacity={0.28}
          />
        )),
      )}
    </group>
  );
}


function SoftGround() {
  const mode = useAppStore((state) => state.mode);
  const stepIndex = useAppStore((state) => state.teaching.stepIndex);
  const hero = mode === 'axis' || (mode === 'teach' && stepIndex >= HERO_STEP_INDEX);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.45, 'rgba(255,255,255,0.55)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, hero ? -0.952 : -0.252, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <shadowMaterial transparent opacity={0.2} color="#3a2e22" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, hero ? -0.936 : -0.238, 0]}
        scale={hero ? [12, 12, 1] : [52, 38, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} color="#4a3b2c" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Stage() {
  const themeKey = useAppStore((state) => state.themeKey);
  const quality = useAppStore((state) => state.quality);
  const mode = useAppStore((state) => state.mode);
  const stepIndex = useAppStore((state) => state.teaching.stepIndex);
  const showGuides = useAppStore((state) => state.showGuides);
  const explode = useAppStore((state) => state.explode);
  const theme = THEMES[themeKey];
  const heroStage = mode === 'axis' || (mode === 'teach' && stepIndex >= HERO_STEP_INDEX);

  return (
    <>
      <FrameDriver />
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.background, 80, 190]} />
      <hemisphereLight args={[theme.background, '#6b6155', 0.9]} />
      <ambientLight intensity={0.42} />
      <directionalLight
        position={[24, 46, 26]}
        intensity={2.35}
        castShadow={quality === 'high'}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={30}
        shadow-camera-bottom={-22}
        shadow-camera-near={1}
        shadow-camera-far={100}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-32, 20, -24]} intensity={0.85} color={'#cfe0ef'} />
      <directionalLight position={[0, 10, 38]} intensity={0.42} color={'#ffd9bd'} />
      <directionalLight position={[0, -26, 18]} intensity={1.6} color={'#fff2e2'} />
      <directionalLight position={[0, -18, -22]} intensity={0.55} color={'#d9e7f2'} />

      {quality === 'high' ? (
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.4} position={[0, 8, 6]} scale={[12, 8, 1]} color={'#fff8ef'} />
          <Lightformer form="rect" intensity={1.2} position={[-10, 4, -6]} scale={[8, 6, 1]} color={'#c9dcf0'} />
          <Lightformer form="rect" intensity={1.0} position={[10, 2, -8]} scale={[8, 6, 1]} color={'#ffe1c9'} />
          <Lightformer form="circle" intensity={1.6} position={[0, 12, 0]} scale={[6, 6, 1]} color={'#ffffff'} />
        </Environment>
      ) : null}


      <SoftGround />

      <group scale={MM} visible={!heroStage}>
        <CaseLower />
        <CaseUpper />
        <Plate />
        <Gaskets />
        <SandwichFoam />
        <BottomFoam />
        <Pcb />
        <CaseScrews />
        <Feet />
        <UsbModule />
        <Stabilizers />
        <SwitchField />
        <Keycaps />
        <KeyGlow />
        <LayerGuides visible={showGuides && mode === 'explode' && explode > 0.12} />
      </group>

      <group scale={MM} visible={heroStage}>
        <HeroSwitch />
      </group>

      <group scale={MM}>
        <Labels />
      </group>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.075}
        rotateSpeed={0.62}
        zoomSpeed={0.8}
        panSpeed={0.7}
        minDistance={5}
        maxDistance={180}
        maxPolarAngle={Math.PI * 0.985}
        target={[0, 2.6, 0]}
        screenSpacePanning
      />
      <CameraRig />
      <ReadySignal />
    </>
  );
}

export function KeyboardScene() {
  const themeKey = useAppStore((state) => state.themeKey);
  const quality = useAppStore((state) => state.quality);
  const setLoading = useAppStore((state) => state.setLoading);
  const theme = THEMES[themeKey];

  return (
    <Canvas
      shadows={quality === 'high' ? 'basic' : false}
      dpr={quality === 'high' ? [1, 2] : [1, 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 24, 41], fov: 38, near: 0.1, far: 400 }}
      onCreated={({ gl, scene, camera }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
        scene.background = new THREE.Color(theme.background);
        camera.lookAt(0, 2.6, 0);
        setLoading(false);
      }}
    >
      <Suspense fallback={null}>
        <Stage />
      </Suspense>
    </Canvas>
  );
}
