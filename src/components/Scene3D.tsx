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
  const [hovered, setHovered] = useState(false);
  
  // Unified bright cyan color for all nodes
  const color = useMemo(() => new THREE.Color('#00d4ff'), []);
  
  // Animation offset for unique floating pattern per node
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Floating animation
      const floatY = Math.sin(state.clock.elapsedTime * 0.5 + floatOffset) * 0.1;
      meshRef.current.position.y = node.position.y + floatY;

      // Scale animation for active/hovered
      const targetScale = isSelected ? 1.4 : hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }

    if (glowRef.current) {
      // Pulsing glow animation
      const glowScale = isSelected ? 2.5 + Math.sin(state.clock.elapsedTime * 2) * 0.3 : hovered ? 2 : 1.5;
      glowRef.current.scale.lerp(new THREE.Vector3(glowScale, glowScale, glowScale), 0.1);
      
      // Glow opacity
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      const targetOpacity = isSelected ? 0.4 : hovered ? 0.2 : isDimmed ? 0.05 : 0.1;
      material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.1);
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
          emissiveIntensity={isSelected ? 1.2 : hovered ? 0.8 : isDimmed ? 0.1 : 0.4}
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={isDimmed ? 0.3 : 1}
        />
      </mesh>

      {/* Inner core with light source */}
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
      
      {/* Nodes are self-illuminating via emissive material - no separate point lights needed */}
    </group>
  );
}

interface EdgeLineProps {
  edge: Edge;
  nodes: IntentNode[];
  visible: boolean;
}

function EdgeLine({ edge, nodes, visible }: EdgeLineProps) {
  const sourceNode = nodes.find(n => n.id === edge.source_intent_id);
  const targetNode = nodes.find(n => n.id === edge.target_intent_id);

  if (!sourceNode || !targetNode || !visible) return null;

  const points = [
    new THREE.Vector3(sourceNode.position.x, sourceNode.position.y, sourceNode.position.z),
    new THREE.Vector3(targetNode.position.x, targetNode.position.y, targetNode.position.z),
  ];

  return (
    <line>
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

  useFrame(() => {
    if (targetPosition && controlsRef.current) {
      // Smoothly move camera to target
      const newTarget = targetPosition.clone();
      controlsRef.current.target.lerp(newTarget, 0.05);
      
      // Position camera offset from target
      const offset = new THREE.Vector3(3, 2, 3);
      const newCameraPos = newTarget.clone().add(offset);
      camera.position.lerp(newCameraPos, 0.05);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      minDistance={2}
      maxDistance={30}
      enablePan={true}
      panSpeed={0.5}
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
      camera={{ position: [0, 0, 10], fov: 60 }}
      className="three-canvas"
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['hsl(222, 47%, 4%)']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      {/* Point lights now emanate from each node's white core */}

      {/* Background stars */}
      <Stars radius={50} depth={50} count={3000} factor={8} saturation={0} fade speed={0.5} />

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
