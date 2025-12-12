import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { IntentNode, Edge } from '@/types';

interface IntentNode3DProps {
  node: IntentNode;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function IntentNode3D({ node, isSelected, isHighlighted, isDimmed, onClick, onHover }: IntentNode3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const [hovered, setHovered] = useState(false);
  
  // Unified bright cyan color for all nodes
  const color = useMemo(() => new THREE.Color('#00d4ff'), []);
  
  // Animation offset for unique floating pattern per node
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);
  const rotationSpeed = useMemo(() => ({
    x: (Math.random() - 0.5) * 0.2,
    y: (Math.random() - 0.5) * 0.2,
    z: (Math.random() - 0.5) * 0.2,
  }), []);

  // Particle ring around active nodes
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 30;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.6;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius;
      positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  const particleMaterial = useMemo(() => 
    new THREE.PointsMaterial({
      color: color,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    }), 
  [color]);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      const floatY = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.1;
      meshRef.current.position.y = node.position.y + floatY;

      // Rotation animation - always rotating slowly
      meshRef.current.rotation.x += rotationSpeed.x * 0.01;
      meshRef.current.rotation.y += rotationSpeed.y * 0.01;
      meshRef.current.rotation.z += rotationSpeed.z * 0.01;

      // Scale animation for active/hovered
      const targetScale = isSelected ? 1.5 : hovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (glowRef.current) {
      // Pulsing glow animation - more dramatic
      const glowScale = isSelected 
        ? 2.8 + Math.sin(state.clock.elapsedTime * 3) * 0.4 
        : hovered ? 2.3 : 1.5;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      
      // Glow opacity
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isSelected ? 0.5 : hovered ? 0.3 : isDimmed ? 0.05 : 0.15;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
    }

    // Particle ring animation - only show when selected
    if (particlesRef.current && isSelected) {
      particlesRef.current.rotation.z += 0.02;
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0.8, 0.1);
    } else if (particlesRef.current) {
      const material = particlesRef.current.material as THREE.PointsMaterial;
      material.opacity = THREE.MathUtils.lerp(material.opacity, 0, 0.1);
    }
  });

  return (
    <group position={[node.position.x, node.position.y, node.position.z]}>
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Main node sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onHover(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 1.0 : hovered ? 0.7 : isDimmed ? 0.05 : 0.3}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={isDimmed ? 0.3 : 1}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>

      {/* Particle ring - only visible when selected */}
      <points ref={particlesRef} geometry={particleGeometry} material={particleMaterial} />

      {/* Dynamic point light from active nodes */}
      {isSelected && (
        <pointLight color={color} intensity={2} distance={3} decay={2} />
      )}

      {/* Floating text label - always visible, bigger and readable */}
      <Html
        position={[0, -0.5, 0]}
        center
        distanceFactor={5}
        style={{
          pointerEvents: 'none',
          transition: 'all 0.2s',
        }}
      >
        <div
          className={`
            px-6 py-3 rounded-2xl backdrop-blur-xl border-2
            transition-all duration-200
            ${isSelected 
              ? 'bg-primary/95 border-primary text-primary-foreground shadow-xl shadow-primary/60' 
              : hovered 
                ? 'bg-secondary/90 border-primary/70 text-primary'
                : 'bg-secondary/80 border-border/50 text-foreground'
            }
          `}
          style={{
            fontSize: '30px',
            fontWeight: isSelected || hovered ? 700 : 500,
            whiteSpace: 'normal',
            textAlign: 'center',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            letterSpacing: '0.02em',
            lineHeight: '1.2',
          }}
        >
          {node.title}
        </div>
      </Html>
    </group>
  );
}

interface EdgeLineProps {
  edge: Edge;
  nodes: IntentNode[];
  visible: boolean;
}

function EdgeLine({ edge, nodes, visible }: EdgeLineProps) {
  const lineRef = useRef<THREE.Line>(null);
  const sourceNode = nodes.find(n => n.id === edge.source_intent_id);
  const targetNode = nodes.find(n => n.id === edge.target_intent_id);

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      // Pulsing opacity
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      material.opacity = visible ? pulse : 0;
    }
  });

  if (!sourceNode || !targetNode) return null;

  const points = [
    new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
    new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
  ];

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        color="#ffffff" 
        transparent 
        opacity={0.5}
        linewidth={2}
      />
    </line>
  );
}

interface CameraControllerProps {
  targetPosition: THREE.Vector3 | null;
}

function CameraController({ targetPosition }: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const idleTime = useRef(0);
  const prevTargetRef = useRef<THREE.Vector3 | null>(null);

  useFrame((state, delta) => {
    // Detect when target is cleared (reset view)
    if (prevTargetRef.current && !targetPosition && controlsRef.current) {
      // Reset camera to default position
      const defaultPos = new THREE.Vector3(0, 0, 15);
      camera.position.lerp(defaultPos, 0.1);
      controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      idleTime.current = 0; // Reset idle time to enable auto-orbit
    }

    if (targetPosition && controlsRef.current) {
      // Smooth fly-to with easing
      const newTarget = targetPosition.clone();
      controlsRef.current.target.lerp(newTarget, 0.08);
      
      // Position camera with cinematic offset
      const offset = new THREE.Vector3(3, 2, 3);
      const newCameraPos = newTarget.clone().add(offset);
      camera.position.lerp(newCameraPos, 0.08);
      
      idleTime.current = 0;
    } else {
      // Auto-orbit when idle for more than 2 seconds
      idleTime.current += delta;
      if (idleTime.current > 2 && controlsRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 0.5;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
    }

    prevTargetRef.current = targetPosition;
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={5}
      maxDistance={50}
      enablePan={true}
      panSpeed={0.5}
      autoRotate={false}
      autoRotateSpeed={0.5}
    />
  );
}

interface Scene3DProps {
  nodes: IntentNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  highlightedNodeIds: string[];
  showEdges: boolean;
  onNodeSelect: (node: IntentNode) => void;
}

export function Scene3D({
  nodes,
  edges,
  selectedNodeId,
  highlightedNodeIds,
  showEdges,
  onNodeSelect,
}: Scene3DProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const targetPosition = useMemo(() => {
    if (selectedNodeId) {
      const node = nodes.find(n => n.id === selectedNodeId);
      if (node) {
        return new THREE.Vector3(node.position.x, node.position.y, node.position.z);
      }
    }
    return null;
  }, [selectedNodeId, nodes]);

  const hasHighlights = highlightedNodeIds.length > 0;

  return (
    <Canvas
      camera={{ position: [0, 0, 15], fov: 75 }}
      className="three-canvas"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['hsl(222, 47%, 4%)']} />
      
      {/* Enhanced Lighting for depth */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[15, 15, 10]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-15, 10, -15]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[15, -10, 15]} intensity={0.6} color="#7c3aed" />

      {/* Enhanced background stars - more spacious */}
      <Stars radius={100} depth={80} count={5000} factor={10} saturation={0} fade speed={0.3} />

      {/* Edges */}
      {edges.map((edge) => (
        <EdgeLine key={edge.id} edge={edge} nodes={nodes} visible={showEdges} />
      ))}

      {/* Nodes */}
      {nodes.map((node) => (
        <IntentNode3D
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          isHighlighted={highlightedNodeIds.includes(node.id)}
          isDimmed={hasHighlights && !highlightedNodeIds.includes(node.id) && selectedNodeId !== node.id}
          onClick={() => onNodeSelect(node)}
          onHover={(hovered) => setHoveredNodeId(hovered ? node.id : null)}
        />
      ))}

      {/* Camera controls */}
      <CameraController targetPosition={targetPosition} />
    </Canvas>
  );
}
