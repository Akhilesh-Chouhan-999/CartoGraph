import {
  Background,
  BackgroundVariant,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTheme } from '../../context/use-theme.js';

interface HeroNodeData extends Record<string, unknown> {
  label: string;
  role: 'entrypoint' | 'controller' | 'middleware' | 'service' | 'repository' | 'model';
  description: string;
  incoming: number;
  outgoing: number;
}

type HeroCustomNode = Node<HeroNodeData, 'heroNode'>;

const roleThemeStyles: Record<
  HeroNodeData['role'],
  { border: string; bg: string; text: string; dot: string; glow: string }
> = {
  entrypoint: {
    border: 'var(--graph-entry, #2563eb)',
    bg: 'var(--graph-entry-surface, #eff6ff)',
    text: 'var(--graph-entry, #2563eb)',
    dot: '#2563eb',
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  controller: {
    border: 'var(--graph-controller, #0891b2)',
    bg: 'var(--graph-controller-surface, #ecfeff)',
    text: 'var(--graph-controller, #0891b2)',
    dot: '#0891b2',
    glow: 'rgba(8, 145, 178, 0.25)',
  },
  middleware: {
    border: 'var(--graph-other, #64748b)',
    bg: 'var(--graph-other-surface, #f8fafc)',
    text: 'var(--graph-other, #64748b)',
    dot: '#64748b',
    glow: 'rgba(100, 116, 139, 0.2)',
  },
  service: {
    border: 'var(--graph-service, #9333ea)',
    bg: 'var(--graph-service-surface, #faf5ff)',
    text: 'var(--graph-service, #9333ea)',
    dot: '#9333ea',
    glow: 'rgba(147, 51, 234, 0.25)',
  },
  repository: {
    border: 'var(--graph-repository, #ea580c)',
    bg: 'var(--graph-repository-surface, #fff7ed)',
    text: 'var(--graph-repository, #ea580c)',
    dot: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.25)',
  },
  model: {
    border: 'var(--graph-model, #16a34a)',
    bg: 'var(--graph-model-surface, #f0fdf4)',
    text: 'var(--graph-model, #16a34a)',
    dot: '#16a34a',
    glow: 'rgba(22, 163, 74, 0.25)',
  },
};

/**
 * Custom interactive node for the landing hero graph.
 */
function HeroNode({ data, selected }: NodeProps<HeroCustomNode>) {
  const styles = roleThemeStyles[data.role];

  return (
    <div
      className={`hero-flow-node${selected ? ' hero-node-selected' : ''}`}
      style={{
        borderColor: styles.border,
        boxShadow: selected
          ? `0 0 0 2px ${styles.border}, 0 8px 20px ${styles.glow}`
          : 'var(--shadow-sm)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="hero-handle"
        style={{ background: styles.border }}
      />
      <div className="hero-node-header">
        <span
          className="hero-role-pill"
          style={{
            backgroundColor: styles.bg,
            color: styles.text,
            borderColor: styles.border,
          }}
        >
          <span className="hero-role-dot" style={{ backgroundColor: styles.dot }} />
          {data.role}
        </span>
      </div>
      <div className="hero-node-body">
        <code className="hero-node-file">{data.label}</code>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="hero-handle"
        style={{ background: styles.border }}
      />
    </div>
  );
}

const nodeTypes = {
  heroNode: HeroNode,
};

const initialNodes: HeroCustomNode[] = [
  {
    id: 'entry',
    type: 'heroNode',
    position: { x: 135, y: 15 },
    data: {
      label: 'main.ts',
      role: 'entrypoint',
      description: 'Application bootstrap, route initialization & middleware registration.',
      incoming: 0,
      outgoing: 2,
    },
  },
  {
    id: 'controller',
    type: 'heroNode',
    position: { x: 40, y: 105 },
    data: {
      label: 'order.controller.ts',
      role: 'controller',
      description: 'REST routes and HTTP request payload validation.',
      incoming: 1,
      outgoing: 1,
    },
  },
  {
    id: 'middleware',
    type: 'heroNode',
    position: { x: 250, y: 105 },
    data: {
      label: 'auth.middleware.ts',
      role: 'middleware',
      description: 'Bearer token verification & user context propagation.',
      incoming: 1,
      outgoing: 1,
    },
  },
  {
    id: 'service',
    type: 'heroNode',
    position: { x: 135, y: 195 },
    data: {
      label: 'order.service.ts',
      role: 'service',
      description: 'Core domain logic, payment verification & inventory checks.',
      incoming: 2,
      outgoing: 2,
    },
  },
  {
    id: 'repository',
    type: 'heroNode',
    position: { x: 40, y: 285 },
    data: {
      label: 'order.repository.ts',
      role: 'repository',
      description: 'Database query abstraction, transactions & document mapping.',
      incoming: 1,
      outgoing: 1,
    },
  },
  {
    id: 'model',
    type: 'heroNode',
    position: { x: 250, y: 285 },
    data: {
      label: 'order.model.ts',
      role: 'model',
      description: 'Mongoose schema, TypeScript interface & index definitions.',
      incoming: 2,
      outgoing: 0,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e-entry-controller',
    source: 'entry',
    target: 'controller',
    animated: true,
    style: { stroke: 'var(--primary, #2563eb)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary, #2563eb)' },
  },
  {
    id: 'e-entry-middleware',
    source: 'entry',
    target: 'middleware',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e-controller-service',
    source: 'controller',
    target: 'service',
    animated: true,
    style: { stroke: 'var(--cyan, #0891b2)', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--cyan, #0891b2)' },
  },
  {
    id: 'e-middleware-service',
    source: 'middleware',
    target: 'service',
    animated: true,
    style: { stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
  },
  {
    id: 'e-service-repository',
    source: 'service',
    target: 'repository',
    animated: true,
    style: { stroke: '#9333ea', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9333ea' },
  },
  {
    id: 'e-service-model',
    source: 'service',
    target: 'model',
    animated: true,
    style: { stroke: '#9333ea', strokeWidth: 1.5, strokeDasharray: '3 3' },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9333ea' },
  },
  {
    id: 'e-repository-model',
    source: 'repository',
    target: 'model',
    animated: true,
    style: { stroke: '#ea580c', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ea580c' },
  },
];

/**
 * Interactive dependency graph for the hero section with zoom, pan, node selection, and controls.
 */
export function InteractiveHeroGraph() {
  const { theme } = useTheme();
  const [nodes, , onNodesChange] = useNodesState<HeroCustomNode>(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [activeNode, setActiveNode] = useState<HeroNodeData | null>(initialNodes[3]?.data ?? null);
  const [reactFlowInstance, setReactFlowInstance] = useState<{
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
  } | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setActiveNode(node.data as unknown as HeroNodeData);
  }, []);

  return (
    <div className="hero-interactive-graph-frame">
      {/* Top Floating Badge & Controls */}
      <div className="hero-graph-toolbar">
        <div className="hero-graph-status">
          <span className="hero-pulse-dot" />
          <strong>Dynamic AST Graph</strong>
          <span className="hero-hint">Zoom &amp; drag enabled</span>
        </div>
        <div className="hero-graph-actions">
          <button
            type="button"
            className="hero-graph-btn"
            onClick={() => reactFlowInstance?.zoomIn()}
            aria-label="Zoom in graph"
            title="Zoom in"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            className="hero-graph-btn"
            onClick={() => reactFlowInstance?.zoomOut()}
            aria-label="Zoom out graph"
            title="Zoom out"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            className="hero-graph-btn"
            onClick={() => reactFlowInstance?.fitView()}
            aria-label="Reset zoom and center view"
            title="Fit to view"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="hero-graph-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onInit={(instance) => {
            setReactFlowInstance(instance);
            instance.fitView({ padding: 0.15 });
          }}
          minZoom={0.5}
          maxZoom={2.0}
          proOptions={{ hideAttribution: true }}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          zoomOnScroll
          panOnDrag
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={18}
            size={1.2}
            color={theme === 'dark' ? '#334155' : '#cbd5e1'}
          />
        </ReactFlow>
      </div>

      {/* Interactive Inspector Pill showing selected node metadata */}
      {activeNode && (
        <div className="hero-selected-inspector">
          <div className="inspector-title-row">
            <span className="inspector-role-badge">{activeNode.role}</span>
            <code className="inspector-filename">{activeNode.label}</code>
          </div>
          <p className="inspector-desc">{activeNode.description}</p>
          <div className="inspector-metrics">
            <span>
              <strong>{activeNode.incoming}</strong> incoming imports
            </span>
            <span>
              <strong>{activeNode.outgoing}</strong> downstream dependents
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
