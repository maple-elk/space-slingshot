import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { predict3DTrajectory, calculateInitialVelocity } from '../../utils/physics3d';

export default function SpaceCanvas3D({
  level,
  pitch,
  yaw,
  power,
  gameStatus,
  projectilePos,
  projectileVel,
  trail,
  pastTrails = [],
  showAllPastTrails,
  cameraTarget,
  gravityG,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);

  // Object mesh references
  const objectsGroupRef = useRef(new THREE.Group());
  const pastTrailsGroupRef = useRef(new THREE.Group());
  const shipGroupRef = useRef(null);
  const targetMeshRef = useRef(null);
  const projectileMeshRef = useRef(null);
  const trajectoryLineRef = useRef(null);
  const trailLineRef = useRef(null);
  const launchArrowRef = useRef(null);
  const enemyShipMeshRef = useRef(null);

  // 1. Initialize Three.js Scene, Camera, Renderer & OrbitControls
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 960;
    const height = container.clientHeight || 600;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050714);
    scene.fog = new THREE.FogExp2(0x050714, 0.00035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 10000);
    camera.position.set(0, 450, 1250);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 3500;
    controls.minDistance = 150;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404668, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(600, 1000, 800);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueGlowLight = new THREE.PointLight(0x3b82f6, 1.5, 2000);
    blueGlowLight.position.set(-600, 200, -300);
    scene.add(blueGlowLight);

    // Starfield Background (2,200 3D Stars)
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2200;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 5000;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 3500;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 5000;

      const colorChoice = Math.random();
      if (colorChoice > 0.8) {
        starColors[i * 3] = 0.6; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1.0;
      } else if (colorChoice > 0.6) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.6;
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
      }
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // Groups
    scene.add(objectsGroupRef.current);
    scene.add(pastTrailsGroupRef.current);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      // Rotate target beacon
      if (targetMeshRef.current) {
        targetMeshRef.current.rotation.y += 0.015;
        targetMeshRef.current.rotation.z += 0.008;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // 2. Build / Update 3D Celestial Level Objects
  useEffect(() => {
    const group = objectsGroupRef.current;
    if (!group) return;

    // Clear existing objects
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    if (!level) return;

    // --- Planets ---
    (level.planets || []).forEach((p) => {
      const planetGroup = new THREE.Group();
      planetGroup.position.set(p.x, p.y, p.z);

      const geo = new THREE.SphereGeometry(p.radius, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(p.fill || '#ec4899'),
        roughness: 0.4,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      planetGroup.add(mesh);

      // Atmosphere Glow Ring
      const glowGeo = new THREE.SphereGeometry(p.radius * 1.14, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(p.fill || '#ec4899'),
        transparent: true,
        opacity: 0.22,
        side: THREE.BackSide,
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      planetGroup.add(glowMesh);

      // Saturn Ring
      if (p.id % 2 === 0) {
        const ringGeo = new THREE.RingGeometry(p.radius * 1.35, p.radius * 1.85, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color('#a855f7'),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2.8;
        planetGroup.add(ringMesh);
      }

      group.add(planetGroup);
    });

    // --- Target Sphere & Beacon ---
    if (level.target) {
      const tGroup = new THREE.Group();
      tGroup.position.set(level.target.x, level.target.y, level.target.z);

      const tGeo = new THREE.IcosahedronGeometry(level.target.radius, 2);
      const tMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        wireframe: true,
        emissive: 0x059669,
        emissiveIntensity: 0.6,
      });
      const tMesh = new THREE.Mesh(tGeo, tMat);
      targetMeshRef.current = tMesh;
      tGroup.add(tMesh);

      const coreGeo = new THREE.SphereGeometry(level.target.radius * 0.5, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      tGroup.add(coreMesh);

      const tLight = new THREE.PointLight(0x10b981, 1.5, 300);
      tGroup.add(tLight);

      group.add(tGroup);
    }

    // --- Player Ship ---
    if (level.ship) {
      const sGroup = new THREE.Group();
      sGroup.position.set(level.ship.x, level.ship.y, level.ship.z);

      const sGeo = new THREE.ConeGeometry(18, 36, 16);
      sGeo.rotateX(Math.PI / 2);
      const sMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.8,
        roughness: 0.2,
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.castShadow = true;
      sGroup.add(sMesh);

      const thrusterLight = new THREE.PointLight(0x38bdf8, 2.0, 100);
      thrusterLight.position.set(0, 0, -20);
      sGroup.add(thrusterLight);

      shipGroupRef.current = sGroup;
      group.add(sGroup);
    }

    // --- Black Holes ---
    (level.blackHoles || []).forEach((bh) => {
      const bhGroup = new THREE.Group();
      bhGroup.position.set(bh.x, bh.y, bh.z);

      const coreGeo = new THREE.SphereGeometry(bh.radius, 32, 32);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      bhGroup.add(coreMesh);

      const diskGeo = new THREE.RingGeometry(bh.radius * 1.2, bh.eventRadius, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: 0xf97316,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      const diskMesh = new THREE.Mesh(diskGeo, diskMat);
      diskMesh.rotation.x = Math.PI / 2.3;
      bhGroup.add(diskMesh);

      group.add(bhGroup);
    });

    // --- Asteroid Clouds ---
    (level.asteroids || []).forEach((ast) => {
      const astGeo = new THREE.SphereGeometry(ast.radius, 16, 16);
      const astMat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const astMesh = new THREE.Mesh(astGeo, astMat);
      astMesh.position.set(ast.x, ast.y, ast.z);
      group.add(astMesh);
    });

    // --- Wormhole Portals ---
    (level.wormholes || []).forEach((w) => {
      const wGeo = new THREE.TorusGeometry(w.radius, 5, 16, 32);
      const wMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(w.color || '#06b6d4'),
        wireframe: true,
      });
      const wMesh = new THREE.Mesh(wGeo, wMat);
      wMesh.position.set(w.x, w.y, w.z);
      group.add(wMesh);
    });

    // --- Enemy Ship ---
    if (level.enemyShip) {
      const eGroup = new THREE.Group();
      eGroup.position.set(level.enemyShip.x, level.enemyShip.y, level.enemyShip.z);

      const eGeo = new THREE.ConeGeometry(20, 40, 4);
      eGeo.rotateX(-Math.PI / 2);
      const eMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        metalness: 0.7,
      });
      const eMesh = new THREE.Mesh(eGeo, eMat);
      enemyShipMeshRef.current = eGroup;
      eGroup.add(eMesh);

      const eLight = new THREE.PointLight(0xef4444, 2.0, 150);
      eGroup.add(eLight);

      group.add(eGroup);
    }
  }, [level]);

  // 3. Render 3D Straight Launch Vector Arrow & Dynamic Trajectory Arc
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !level || !level.ship) return;

    // Clean up previous launch arrow
    if (launchArrowRef.current) {
      scene.remove(launchArrowRef.current);
      launchArrowRef.current = null;
    }

    // Clean up previous trajectory line
    if (trajectoryLineRef.current) {
      scene.remove(trajectoryLineRef.current);
      trajectoryLineRef.current.geometry.dispose();
      trajectoryLineRef.current.material.dispose();
      trajectoryLineRef.current = null;
    }

    const isSimulating = gameStatus === 'flying' || gameStatus === 'enemy_flying' || gameStatus === 'enemy_aiming';
    if (isSimulating) return;

    const initialVel = calculateInitialVelocity(pitch, yaw, power);
    const velVec = new THREE.Vector3(initialVel.x, initialVel.y, initialVel.z);
    const speedMag = velVec.length();

    if (speedMag > 0.001) {
      const dir = velVec.clone().normalize();
      const origin = new THREE.Vector3(level.ship.x, level.ship.y, level.ship.z);
      const arrowLength = Math.max(60, power * 2.2);

      // Bright Gold 3D Arrow Helper
      const arrow = new THREE.ArrowHelper(dir, origin, arrowLength, 0xf59e0b, arrowLength * 0.25, arrowLength * 0.12);
      launchArrowRef.current = arrow;
      scene.add(arrow);

      // Orient Player Ship Model to face launch vector
      if (shipGroupRef.current) {
        shipGroupRef.current.lookAt(origin.clone().add(dir));
      }
    }

    // Render Curved Gravitational Trajectory Line
    const points = predict3DTrajectory(level.ship, initialVel, level, gravityG, 180, 0.016);
    const vectorPoints = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const lineGeo = new THREE.BufferGeometry().setFromPoints(vectorPoints);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 10,
      gapSize: 6,
      linewidth: 3,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    trajectoryLineRef.current = line;
    scene.add(line);
  }, [level, pitch, yaw, power, gameStatus, gravityG]);

  // 4. Render Active Flight Projectile & Trail
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (gameStatus === 'flying' && projectilePos) {
      if (!projectileMeshRef.current) {
        const pGeo = new THREE.SphereGeometry(14, 16, 16);
        const pMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        const pLight = new THREE.PointLight(0x38bdf8, 3.5, 250);
        pMesh.add(pLight);
        projectileMeshRef.current = pMesh;
        scene.add(pMesh);
      }
      projectileMeshRef.current.position.set(projectilePos.x, projectilePos.y, projectilePos.z);
    } else if (projectileMeshRef.current && gameStatus !== 'flying') {
      scene.remove(projectileMeshRef.current);
      projectileMeshRef.current.geometry.dispose();
      projectileMeshRef.current.material.dispose();
      projectileMeshRef.current = null;
    }

    // Active Trail Line
    if (trail && trail.length > 1) {
      if (trailLineRef.current) {
        scene.remove(trailLineRef.current);
        trailLineRef.current.geometry.dispose();
        trailLineRef.current.material.dispose();
      }
      const trailVectors = trail.map((pt) => new THREE.Vector3(pt.x, pt.y, pt.z));
      const trailGeo = new THREE.BufferGeometry().setFromPoints(trailVectors);
      const trailMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      trailLineRef.current = trailLine;
      scene.add(trailLine);
    } else if (trailLineRef.current && (!trail || trail.length <= 1)) {
      scene.remove(trailLineRef.current);
      trailLineRef.current.geometry.dispose();
      trailLineRef.current.material.dispose();
      trailLineRef.current = null;
    }
  }, [gameStatus, projectilePos, trail]);

  // 5. Render Persistent Past Shot Trails in 3D
  useEffect(() => {
    const group = pastTrailsGroupRef.current;
    if (!group) return;

    // Clear old past trail lines
    while (group.children.length > 0) {
      const line = group.children[0];
      group.remove(line);
      if (line.geometry) line.geometry.dispose();
      if (line.material) line.material.dispose();
    }

    if (!pastTrails || pastTrails.length === 0) return;

    pastTrails.forEach((tObj) => {
      if (!tObj.points || tObj.points.length < 2) return;

      const pts = tObj.points.map((p) => new THREE.Vector3(p.x, p.y, p.z || 0));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);

      let colorHex = 0x64748b; // neutral gray
      if (tObj.status === 'hit_target') colorHex = 0x10b981; // green
      else if (tObj.status === 'hit_enemy') colorHex = 0xa855f7; // purple
      else if (tObj.status === 'hit_planet' || tObj.status === 'black_hole') colorHex = 0xef4444; // red

      const lineMat = new THREE.LineDashedMaterial({
        color: colorHex,
        dashSize: 12,
        gapSize: 8,
        opacity: 0.65,
        transparent: true,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);
    });
  }, [pastTrails]);

  // 6. Smooth Camera Follow Target during flight
  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    if (cameraTarget) {
      controlsRef.current.target.lerp(
        new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z),
        0.12
      );
    } else if (gameStatus === 'idle' && level && level.ship) {
      controlsRef.current.target.lerp(
        new THREE.Vector3(0, 0, 0),
        0.05
      );
    }
  }, [cameraTarget, gameStatus, level]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        cursor: 'grab',
      }}
    />
  );
}
