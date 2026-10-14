import { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ExternalLink } from "lucide-react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import rawData from "../../data/connections.json";

const FONT_SERIF = '"Playfair Display", Georgia, serif';
const FONT_MONO = '"DM Mono", monospace';
const FONT_SANS = '"DM Sans", sans-serif';

export type Connection = {
  name: string;
  headline: string;
  company: string;
  zone: string;
  profileUrl: string;
};

type ZoneConfig = {
  id: string;
  label: string;
  color: string;
  hex: number;
};

const ZONE_CONFIG: Record<string, ZoneConfig> = {
  all: { id: "all", label: "All Neurons", color: "#D0FF00", hex: 0xd0ff00 },
  "AI & Machine Learning": { id: "ai", label: "AI & ML", color: "#D0FF00", hex: 0xd0ff00 },
  "Software & Cloud": { id: "cloud", label: "Software & Cloud", color: "#8116E0", hex: 0x8116e0 },
  "Founders & Leadership": { id: "leaders", label: "Founders & Leads", color: "#FEFFFC", hex: 0xfefffc },
  "Alumni & Scholars": { id: "scholars", label: "Alumni & Scholars", color: "#D0FF00", hex: 0xd0ff00 },
};

// Pure mathematical notations (Clean, no tacky boxes or fake telemetry)
const MATH_NOTATIONS = [
  "L_synapse = -Σ y_i log(ŷ_i)",
  "∇_θ J(θ) = E[∇ log π_θ · Q]",
  "G = (V, E) | |V|=25, |E|=64",
  "σ(W^T x + b) ≻ 0",
  "Softmax(z_i) = e^{z_i} / Σ e^{z_j}",
  "h_t = tanh(W x_t + U h_{t-1})",
  "ReLU(z) = max(0, z)",
  "Attention(Q, K, V) = softmax(QK^T / √d_k)V",
];

// Generates transparent mathematical formula sprites with natural glowing typography
function createMathSpriteTexture(formula: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Transparent background - NO border box, NO gaming frames
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soft Banana Yellow / Plum Violet glow behind Blanche White text
  ctx.shadowColor = "#D0FF00";
  ctx.shadowBlur = 12;

  // Render mathematical formula in Blanche White
  ctx.font = "italic 32px 'DM Mono', 'Times New Roman', serif";
  ctx.fillStyle = "#FEFFFC";
  ctx.fillText(formula, 20, 58);

  // Subtle second pass for vibrant Banana Yellow shimmer
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#D0FF00";
  ctx.fillText(formula, 20, 58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Generates clean, elegant floating connection labels with no heavy dark boxes
function createCleanNameSprite(name: string, role: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 110;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Subtle soft luminous backdrop for contrast against stars/grid
  const grad = ctx.createRadialGradient(256, 55, 10, 256, 55, 240);
  grad.addColorStop(0, "rgba(2, 6, 18, 0.72)");
  grad.addColorStop(1, "rgba(2, 6, 18, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glowing indicator dot
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(36, 42, 6, 0, Math.PI * 2);
  ctx.fill();

  // Name (Crisp, bold white)
  ctx.shadowColor = "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 8;
  ctx.font = "700 28px 'DM Sans', sans-serif";
  ctx.fillStyle = "#FEFFFC";
  ctx.fillText(name, 56, 50);

  // Role (Subtle, elegant)
  ctx.font = "400 18px 'DM Sans', sans-serif";
  ctx.fillStyle = "rgba(254, 255, 252, 0.8)";
  const truncatedRole = role.length > 34 ? role.slice(0, 31) + "..." : role;
  ctx.fillText(truncatedRole, 56, 82);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

export { ZONE_CONFIG };

export type ThreeNeuronSceneProps = {
  activeZone?: string;
  onZoneChange?: (zone: string) => void;
};

export function ThreeNeuronScene({
  activeZone = "all",
}: ThreeNeuronSceneProps = {}) {
  const isMobile = useIsMobile();
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [hoveredConnection, setHoveredConnection] = useState<Connection | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

  const connections: Connection[] = useMemo(() => {
    return (rawData.connections || []) as Connection[];
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = Math.max(isMobile ? 580 : 780, Math.floor(window.innerHeight * 0.9));

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0314, 0.010);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.set(0, 10, isMobile ? 56 : 46);
    cameraRef.current = camera;

    // 3. Renderer (Completely transparent background)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0); // Transparent to blend seamlessly into portfolio page
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.45;
    controls.maxDistance = 120;
    controls.minDistance = 2.0; // Fly directly inside neurons!
    controls.maxPolarAngle = Math.PI / 2 + 0.12;
    controlsRef.current = controls;

    // 5. Lighting - Banana Yellow (#D0FF00) + Plum Violet (#8116E0) + Blanche White (#FEFFFC)
    const ambientLight = new THREE.AmbientLight(0x21063d, 2.6);
    scene.add(ambientLight);

    const yellowLight = new THREE.PointLight(0xd0ff00, 8.0, 95);
    yellowLight.position.set(15, 20, 15);
    scene.add(yellowLight);

    const violetLight = new THREE.PointLight(0x8116e0, 9.5, 95);
    violetLight.position.set(-25, 12, -15);
    scene.add(violetLight);

    const whiteLight = new THREE.PointLight(0xfefffc, 6.0, 65);
    whiteLight.position.set(0, 6, 0);
    scene.add(whiteLight);

    // 6. Radiant Perspective Floor Grid in Banana Yellow & Plum Violet
    const gridHelper = new THREE.GridHelper(160, 80, 0xd0ff00, 0x47087e);
    gridHelper.position.y = -12;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.5;
    scene.add(gridHelper);

    // Floor Points Grid (Glowing Banana Yellow intersection dots)
    const floorDotGeometry = new THREE.BufferGeometry();
    const floorDotPositions: number[] = [];
    const floorSize = 160;
    const floorSteps = 40;
    const stepSize = floorSize / floorSteps;
    for (let x = -floorSize / 2; x <= floorSize / 2; x += stepSize) {
      for (let z = -floorSize / 2; z <= floorSize / 2; z += stepSize) {
        floorDotPositions.push(x, -11.95, z);
      }
    }
    floorDotGeometry.setAttribute("position", new THREE.Float32BufferAttribute(floorDotPositions, 3));
    const floorDotMaterial = new THREE.PointsMaterial({
      color: 0xd0ff00,
      size: 1.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const floorDots = new THREE.Points(floorDotGeometry, floorDotMaterial);
    scene.add(floorDots);

    // 7. 3D Geodesic Crystal Neurons
    const nodesGroup = new THREE.Group();
    scene.add(nodesGroup);

    type NodeObject = {
      index: number;
      data: Connection;
      position: THREE.Vector3;
      outerMesh: THREE.Mesh;
      wireMesh: THREE.LineSegments;
      coreMesh: THREE.Mesh;
      haloMesh: THREE.Mesh;
      labelSprite: THREE.Sprite;
      beaconParticles: THREE.Points;
      baseColor: THREE.Color;
      zoneId: string;
      radius: number;
      pulsePhase: number;
    };

    const nodeObjects: NodeObject[] = [];
    const interactiveMeshes: THREE.Mesh[] = [];

    const count = connections.length;
    connections.forEach((conn, idx) => {
      const angle = (idx / count) * Math.PI * 2 + Math.sin(idx * 1.5) * 0.45;
      const radiusDist = 13 + ((idx % 5) * 4.2) + Math.cos(idx * 2) * 3;
      const x = Math.cos(angle) * radiusDist + Math.sin(idx * 3) * 2.5;
      const y = -3 + ((idx % 4) * 3.4) + Math.sin(angle * 2) * 2.2;
      const z = Math.sin(angle) * radiusDist + Math.cos(idx * 3) * 2.5;

      const pos = new THREE.Vector3(x, y, z);
      const zone = ZONE_CONFIG[conn.zone] || ZONE_CONFIG.all;
      const baseColor = new THREE.Color(zone.hex);
      const nodeRadius = 1.6 + (idx % 3) * 0.4;

      // Outer Geodesic Icosahedron Shell
      const icosaGeo = new THREE.IcosahedronGeometry(nodeRadius, 1);

      // Translucent glowing crystalline facets
      const facetMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.26,
        wireframe: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const outerMesh = new THREE.Mesh(icosaGeo, facetMat);
      outerMesh.position.copy(pos);
      outerMesh.userData = { connectionIndex: idx, nodeRadius };

      // Geodesic Wireframe Lattice (Vibrant electric cyan edges)
      const wireGeo = new THREE.WireframeGeometry(icosaGeo);
      const wireMat = new THREE.LineBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
      });
      const wireMesh = new THREE.LineSegments(wireGeo, wireMat);
      outerMesh.add(wireMesh);

      // Pure Blanche White Glowing Core Sphere
      const coreGeo = new THREE.SphereGeometry(nodeRadius * 0.42, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0xfefffc,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      outerMesh.add(coreMesh);

      // Luminous Radiant Halo (Additive bloom effect)
      const haloGeo = new THREE.SphereGeometry(nodeRadius * 2.1, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: baseColor,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      outerMesh.add(haloMesh);

      // Vertical Beacon Column (Ascending Banana Yellow particles)
      const beaconHeight = 9 + (idx % 4) * 2.5;
      const pCount = 10;
      const pGeo = new THREE.BufferGeometry();
      const pPos: number[] = [];
      for (let p = 0; p < pCount; p++) {
        pPos.push((Math.random() - 0.5) * 0.3, (p / pCount) * beaconHeight, (Math.random() - 0.5) * 0.3);
      }
      pGeo.setAttribute("position", new THREE.Float32BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({
        color: 0xd0ff00,
        size: 0.55,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const beaconParticles = new THREE.Points(pGeo, pMat);
      outerMesh.add(beaconParticles);

      // Clean Floating Name Sprite (No clunky boxes)
      const labelTex = createCleanNameSprite(conn.name, conn.headline, zone.color);
      const labelSpriteMat = new THREE.SpriteMaterial({
        map: labelTex,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });
      const labelSprite = new THREE.Sprite(labelSpriteMat);
      labelSprite.position.set(0, nodeRadius + 2.2, 0);
      labelSprite.scale.set(6.4, 1.4, 1);
      outerMesh.add(labelSprite);

      nodesGroup.add(outerMesh);
      interactiveMeshes.push(outerMesh);

      nodeObjects.push({
        index: idx,
        data: conn,
        position: pos,
        outerMesh,
        wireMesh,
        coreMesh,
        haloMesh,
        labelSprite,
        beaconParticles,
        baseColor,
        zoneId: conn.zone,
        radius: nodeRadius,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    });

    // 8. Axons & Synaptic Conduits (Luminous Glowing Filaments)
    const conduitGroup = new THREE.Group();
    scene.add(conduitGroup);

    type Edge = {
      fromIndex: number;
      toIndex: number;
      start: THREE.Vector3;
      end: THREE.Vector3;
      color: THREE.Color;
    };

    const edges: Edge[] = [];
    const maxConnectionDistance = 20.0;

    for (let i = 0; i < nodeObjects.length; i++) {
      const nodeA = nodeObjects[i];
      let connectionsFromA = 0;

      for (let j = i + 1; j < nodeObjects.length; j++) {
        const nodeB = nodeObjects[j];
        const dist = nodeA.position.distanceTo(nodeB.position);

        if (dist < maxConnectionDistance && connectionsFromA < 4) {
          edges.push({
            fromIndex: i,
            toIndex: j,
            start: nodeA.position,
            end: nodeB.position,
            color: nodeA.baseColor,
          });
          connectionsFromA++;
        }
      }
    }

    const linePositions: number[] = [];
    const lineColors: number[] = [];

    edges.forEach((edge) => {
      linePositions.push(edge.start.x, edge.start.y, edge.start.z);
      linePositions.push(edge.end.x, edge.end.y, edge.end.z);

      lineColors.push(edge.color.r, edge.color.g, edge.color.b);
      lineColors.push(edge.color.r, edge.color.g, edge.color.b);

      // Radiant glowing inner tube
      const dir = new THREE.Vector3().subVectors(edge.end, edge.start);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(edge.start, edge.end).multiplyScalar(0.5);

      const tubeGeo = new THREE.CylinderGeometry(0.08, 0.08, len, 6);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: edge.color,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.position.copy(mid);
      tubeMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      conduitGroup.add(tubeMesh);
    });

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    linesGeo.setAttribute("color", new THREE.Float32BufferAttribute(lineColors, 3));

    const linesMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
    conduitGroup.add(linesMesh);

    // 9. Luminous Traveling Pulses (Brilliant glowing packets)
    type PulseParticle = {
      edgeIndex: number;
      progress: number;
      speed: number;
    };

    const pulseCount = 42;
    const pulses: PulseParticle[] = [];
    for (let p = 0; p < pulseCount; p++) {
      pulses.push({
        edgeIndex: Math.floor(Math.random() * edges.length),
        progress: Math.random(),
        speed: 0.007 + Math.random() * 0.014,
      });
    }

    const pulseGeo = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulseCount * 3);
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));

    const pulseMat = new THREE.PointsMaterial({
      color: 0xd0ff00,
      size: 2.2,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    scene.add(pulsePoints);

    // 10. Elegant Floating Mathematical Formulas (Clean, no boxes)
    const formulasGroup = new THREE.Group();
    scene.add(formulasGroup);

    MATH_NOTATIONS.forEach((notation, idx) => {
      const tex = createMathSpriteTexture(notation);
      const spriteMat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);

      const angle = (idx / MATH_NOTATIONS.length) * Math.PI * 2;
      const fRadius = 24 + (idx % 2) * 5;
      sprite.position.set(
        Math.cos(angle) * fRadius,
        -1 + (idx % 3) * 4.5,
        Math.sin(angle) * fRadius
      );
      sprite.scale.set(8.5, 1.4, 1);
      formulasGroup.add(sprite);
    });

    // 11. Ambient Floating Stardust (Plum Violet)
    const dustCount = 220;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos: number[] = [];
    for (let d = 0; d < dustCount; d++) {
      dustPos.push(
        (Math.random() - 0.5) * 90,
        -8 + Math.random() * 26,
        (Math.random() - 0.5) * 90
      );
    }
    dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0x8116e0,
      size: 0.7,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // 12. Interaction: Raycaster for Hover & Click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);
    let currentHoveredMesh: THREE.Mesh | null = null;

    const onPointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onClick = () => {
      if (currentHoveredMesh) {
        const connIdx = currentHoveredMesh.userData.connectionIndex;
        if (connIdx !== undefined && connections[connIdx]) {
          const targetConn = connections[connIdx];
          setSelectedConnection(targetConn);
          window.open(targetConn.profileUrl, "_blank", "noopener,noreferrer");
        }
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener("mousemove", onPointerMove);
    canvasEl.addEventListener("click", onClick);

    const onCanvasWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    canvasEl.addEventListener("wheel", onCanvasWheel, { passive: true });

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Raycast hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (currentHoveredMesh !== hit) {
          currentHoveredMesh = hit;
          canvasEl.style.cursor = "pointer";
          const connIdx = hit.userData.connectionIndex;
          if (connIdx !== undefined) {
            setHoveredConnection(connections[connIdx]);
          }
        }
      } else {
        if (currentHoveredMesh) {
          currentHoveredMesh = null;
          canvasEl.style.cursor = "grab";
          setHoveredConnection(null);
        }
      }

      // Update Nodes
      for (let i = 0; i < nodeObjects.length; i++) {
        const node = nodeObjects[i];
        const isHovered = currentHoveredMesh === node.outerMesh;
        const isSelected = selectedConnection?.name === node.data.name;
        const matchesZone = activeZone === "all" || node.zoneId === activeZone;

        node.outerMesh.rotation.y += 0.009;
        node.outerMesh.rotation.x += 0.004;

        node.pulsePhase += delta * 2.4;
        const breathe = Math.sin(node.pulsePhase) * 0.09;

        const targetScale = isHovered || isSelected ? 1.6 : matchesZone ? 1.0 + breathe : 0.6;
        node.outerMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

        const distToCam = camera.position.distanceTo(node.outerMesh.position);
        const isClose = distToCam < 26;

        const targetLabelOpacity = isHovered || isSelected ? 1.0 : isClose ? 0.95 : matchesZone ? 0.75 : 0.15;
        (node.labelSprite.material as THREE.SpriteMaterial).opacity = THREE.MathUtils.lerp(
          (node.labelSprite.material as THREE.SpriteMaterial).opacity,
          targetLabelOpacity,
          0.1
        );

        (node.haloMesh.material as THREE.MeshBasicMaterial).opacity = isHovered ? 0.8 : matchesZone ? 0.55 : 0.1;

        // Animate beacon particles upward
        const pAttr = node.beaconParticles.geometry.attributes.position as THREE.BufferAttribute;
        const pArray = pAttr.array as Float32Array;
        for (let p = 1; p < pArray.length; p += 3) {
          pArray[p] += delta * 2.8;
          if (pArray[p] > 10) pArray[p] = 0;
        }
        pAttr.needsUpdate = true;
      }

      // Update traveling pulses
      const positions = pulseGeo.attributes.position.array as Float32Array;
      for (let k = 0; k < pulses.length; k++) {
        const p = pulses[k];
        if (p.edgeIndex >= edges.length) continue;
        const edge = edges[p.edgeIndex];
        p.progress += p.speed;
        if (p.progress >= 1) {
          p.progress = 0;
          p.edgeIndex = Math.floor(Math.random() * edges.length);
        }

        const currX = edge.start.x + (edge.end.x - edge.start.x) * p.progress;
        const currY = edge.start.y + (edge.end.y - edge.start.y) * p.progress;
        const currZ = edge.start.z + (edge.end.z - edge.start.z) * p.progress;

        positions[k * 3] = currX;
        positions[k * 3 + 1] = currY;
        positions[k * 3 + 2] = currZ;
      }
      pulseGeo.attributes.position.needsUpdate = true;

      // Subtle float of formulas
      formulasGroup.rotation.y = Math.sin(elapsedTime * 0.07) * 0.12;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = Math.max(isMobile ? 580 : 780, Math.floor(window.innerHeight * 0.9));
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvasEl.removeEventListener("mousemove", onPointerMove);
      canvasEl.removeEventListener("click", onClick);
      canvasEl.removeEventListener("wheel", onCanvasWheel);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [connections, isMobile, activeZone, selectedConnection]);

  const activeProfile = selectedConnection || hoveredConnection;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: isMobile ? "580px" : "780px",
        background: "transparent", // NO BOX! Pure transparent background blending into the page
        overflow: "visible",
      }}
    >
      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: isMobile ? "580px" : "780px",
          display: "block",
          cursor: "grab",
        }}
      />

      {/* Minimalist Profile Inspection Card (Appears only on Hover/Select) */}
      {activeProfile && (
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: isMobile ? "1.2rem" : "6vw",
            right: isMobile ? "1.2rem" : "auto",
            maxWidth: isMobile ? "none" : "390px",
            padding: "1.1rem 1.4rem",
            borderRadius: "10px",
            background: "rgba(12, 3, 24, 0.94)",
            border: `1px solid ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}66`,
            boxShadow: `0 16px 40px rgba(0,0,0,0.9), 0 0 28px ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}33`,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            zIndex: 35,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            {/* Glowing Avatar Initials */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}44, ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}bb)`,
                border: `1.5px solid ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_MONO,
                fontSize: "0.92rem",
                fontWeight: 700,
                color: "#FEFFFC",
                flexShrink: 0,
                boxShadow: `0 0 16px ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}66`,
              }}
            >
              {activeProfile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <h4
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "#FEFFFC",
                    margin: 0,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activeProfile.name}
                </h4>
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.54rem",
                    letterSpacing: "0.08em",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: `${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}20`,
                    border: `1px solid ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}60`,
                    color: ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {activeProfile.zone}
                </span>
              </div>

              <p
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: "0.82rem",
                  color: "rgba(254, 255, 252, 0.75)",
                  margin: "0.3rem 0 0",
                  lineHeight: 1.45,
                }}
              >
                {activeProfile.headline}
              </p>

              <div
                style={{
                  marginTop: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "0.55rem",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.56rem",
                    letterSpacing: "0.08em",
                    color: "rgba(254, 255, 252, 0.5)",
                  }}
                >
                  Click neuron to open
                </span>

                <a
                  href={activeProfile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontFamily: FONT_MONO,
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    color: "#FEFFFC",
                    background: `${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}33`,
                    border: `1px solid ${ZONE_CONFIG[activeProfile.zone]?.color || "#D0FF00"}`,
                    padding: "4px 11px",
                    borderRadius: "4px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                  }}
                >
                  LinkedIn Profile <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
