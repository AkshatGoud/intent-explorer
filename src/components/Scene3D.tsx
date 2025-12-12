import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float, Line, Sphere, Sparkles } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { IntentNode, Edge, NODE_COLORS } from '@/types';

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
  const [hovered, setHovered] = useState(false);
  
  const colorIndex = useMemo(() => {
    const colors: Record<string, number> = {
      cyan: 0, purple: 1, blue: 2, teal: 3, pink: 4, gold: 5, green: 6
    };
    return colors[node.color_group] ?? 0;
  }, [node.color_group]);

  const color = useMemo(() => new THREE.Color(NODE_COLORS[colorIndex]), [colorIndex]);
  const scale = useMemo(() => Math.max(0.3, Math.min(1.5, node.size / 15)), [node.size]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing animation
      const t = state.clock.elapsedTime;
      meshRef.current.scale.setScalar(scale * (1 + Math.sin(t * 2 + node.position.x) * 0.05));
      
      // Glow intensity based on state
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        const targetEmissive = (isSelected || hovered) ? 0.5 : isHighlighted ? 0.3 : isDimmed ? 0.05 : 0.15;
        material.emissiveIntensity = THREE.MathUtils.lerp(material.emissiveIntensity, targetEmissive, 0.1);
        material.opacity = THREE.MathUtils.lerp(material.opacity, isDimmed ? 0.3 : 1, 0.1);
      }
    }
  });

  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group position={[node.position.x, node.position.y, node.position.z]}>
        <Sphere
          ref={meshRef}
          args={[0.5, 32, 32]}
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
            document.body.style.cursor = 'default';
          }}
        >
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.15}
            roughness={0.3}
            metalness={0.6}
            transparent
            opacity={1}
          />
        </Sphere>

        {/* Glow effect */}
        {(isSelected || hovered) && (
          <Sphere args={[0.7, 16, 16]} scale={scale}>
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.15}
              depthWrite={false}
            />
          </Sphere>
        )}

        {/* Tooltip on hover */}
        {hovered && !isSelected && (
          <Html
            position={[0, scale + 0.5, 0]}
            center
            style={{
              pointerEvents: 'none',
              transform: 'translateY(-100%)',
            }}
          >
            <div className="glass-panel px-3 py-2 max-w-[200px] animate-fade-in">
              <p className="text-sm font-medium text-foreground truncate">{node.title}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {node.keywords.slice(0, 3).map((kw) => (
                  <span key={kw} className="text-[10px] text-primary bg-primary/10 px-1 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </Html>
        )}
      </group>
    </Float>
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
    <Line
      points={points}
      color="hsl(186, 60%, 40%)"
      lineWidth={1}
      transparent
      opacity={edge.weight * 0.3}
    />
  );
}

interface CameraControllerProps {
  targetPosition: THREE.Vector3 | null;
}

function CameraController({ targetPosition }: CameraControllerProps) {
  const { camera, controls } = useThree();
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
      camera={{ position: [8, 5, 8], fov: 50 }}
      className="three-canvas"
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={['hsl(222, 47%, 6%)']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="hsl(270, 60%, 60%)" />
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={0.8}
        color="hsl(186, 100%, 60%)"
      />

      {/* Background particles */}
      <Sparkles
        count={200}
        size={1.5}
        scale={30}
        color="hsl(186, 80%, 60%)"
        opacity={0.3}
        speed={0.3}
      />

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
