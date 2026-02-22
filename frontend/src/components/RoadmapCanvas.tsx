import { useState, useEffect, useRef, Fragment } from 'react';
import type { TopicSummary } from '../types';
import {
  Lock,
  Play,
  Clock,
  CheckCircle2,
  Sparkles,
  Cpu,
} from 'lucide-react';

// ── Types ──

interface RoadmapCanvasProps {
  topics: TopicSummary[];
  onTopicClick?: (topicId: string, status: string) => void;
  selectedTopicId?: string | null;
  generatingTopicId?: string | null;
  isGenerating?: boolean;
  nodesPerRow?: number;
  animate?: boolean;
  title?: string;
}

interface CanvasRow {
  nodes: (TopicSummary | SkeletonNode)[];
  direction: 'ltr' | 'rtl';
  rowIndex: number;
}

interface SkeletonNode {
  id: string;
  title: string;
  sequenceOrder: number;
  isSkeleton: true;
}

// ── Constants ──

const STATUS_STYLES: Record<string, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
  LOCKED: {
    border: 'border-border-primary',
    bg: 'bg-bg-tertiary',
    text: 'text-text-muted',
    icon: <Lock size={11} />,
  },
  AVAILABLE: {
    border: 'border-accent-blue/40',
    bg: 'bg-accent-dim-blue/30',
    text: 'text-accent-blue',
    icon: <Play size={11} />,
  },
  IN_PROGRESS: {
    border: 'border-accent-orange/40',
    bg: 'bg-accent-dim-orange/30',
    text: 'text-accent-orange',
    icon: <Clock size={11} />,
  },
  COMPLETED: {
    border: 'border-accent-green/40',
    bg: 'bg-accent-dim-green/30',
    text: 'text-accent-green',
    icon: <CheckCircle2 size={11} />,
  },
};

const GENERATING_PHASES = [
  'initializing reasoning model...',
  'analyzing learning objectives...',
  'mapping knowledge domains...',
  'structuring topic hierarchy...',
  'generating subtopic details...',
  'calculating time estimates...',
  'optimizing learning path...',
  'building prerequisite graph...',
  'assigning difficulty levels...',
  'finalizing roadmap structure...',
];

// ── Helpers ──

function isSkeleton(node: TopicSummary | SkeletonNode): node is SkeletonNode {
  return 'isSkeleton' in node && node.isSkeleton;
}

function buildSnakeRows(
  nodes: (TopicSummary | SkeletonNode)[],
  nodesPerRow: number,
): CanvasRow[] {
  const rows: CanvasRow[] = [];
  for (let i = 0; i < nodes.length; i += nodesPerRow) {
    const rowIndex = Math.floor(i / nodesPerRow);
    const rowNodes = nodes.slice(i, i + nodesPerRow);
    // Odd rows go right-to-left (reverse the display order)
    rows.push({
      nodes: rowIndex % 2 === 1 ? [...rowNodes].reverse() : rowNodes,
      direction: rowIndex % 2 === 0 ? 'ltr' : 'rtl',
      rowIndex,
    });
  }
  return rows;
}

// ── Component ──

export default function RoadmapCanvas({
  topics,
  onTopicClick,
  selectedTopicId,
  generatingTopicId,
  isGenerating = false,
  nodesPerRow = 5,
  animate = true,
  title,
}: RoadmapCanvasProps) {
  const [phase, setPhase] = useState(0);
  const [visibleSkeletons, setVisibleSkeletons] = useState(1);
  const [revealedCount, setRevealedCount] = useState(0);
  const prevTopicCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cycle through generating phases
  useEffect(() => {
    if (!isGenerating) return;
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % GENERATING_PHASES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Progressively reveal skeleton nodes during generation
  useEffect(() => {
    if (!isGenerating) return;
    setVisibleSkeletons(1);
    const timer = setInterval(() => {
      setVisibleSkeletons((v) => {
        if (v >= 10) return 10;
        return v + 1;
      });
    }, 2800);
    return () => clearInterval(timer);
  }, [isGenerating]);

  // Stagger reveal of real topics when they arrive
  useEffect(() => {
    if (topics.length > 0 && prevTopicCountRef.current === 0 && animate) {
      // Topics just appeared — stagger reveal
      setRevealedCount(0);
      let count = 0;
      const timer = setInterval(() => {
        count++;
        setRevealedCount(count);
        if (count >= topics.length) clearInterval(timer);
      }, 150);
      return () => clearInterval(timer);
    } else if (topics.length > 0) {
      setRevealedCount(topics.length);
    }
    prevTopicCountRef.current = topics.length;
  }, [topics.length, animate]);

  // Build skeleton nodes for generating state
  const skeletonNodes: SkeletonNode[] = Array.from({ length: visibleSkeletons }, (_, i) => ({
    id: `skeleton-${i}`,
    title: '',
    sequenceOrder: i + 1,
    isSkeleton: true,
  }));

  const displayNodes: (TopicSummary | SkeletonNode)[] =
    isGenerating && topics.length === 0 ? skeletonNodes : topics;

  const rows = buildSnakeRows(displayNodes, nodesPerRow);

  // Determine the global index of each node for animation delay
  let globalIdx = 0;

  return (
    <div ref={containerRef} className="w-full">
      {/* Terminal header */}
      {(title || isGenerating) && (
        <div className="flex items-center gap-2 mb-4 px-1">
          {isGenerating ? (
            <>
              <Cpu size={14} className="text-accent-green canvas-node-glow" />
              <span className="text-xs text-accent-green font-medium">
                generating roadmap
              </span>
              <span className="text-[11px] text-text-muted ml-2 canvas-dot-pulse">
                <span>.</span><span>.</span><span>.</span>
              </span>
            </>
          ) : (
            <>
              <Sparkles size={14} className="text-accent-cyan" />
              <span className="text-xs text-text-secondary font-medium">
                {title || 'roadmap topology'}
              </span>
              <span className="text-[11px] text-text-muted ml-auto">
                {topics.length} nodes
              </span>
            </>
          )}
        </div>
      )}

      {/* Canvas grid */}
      <div className="relative border border-border-primary rounded-lg bg-bg-secondary/50 p-5 overflow-x-auto">
        {/* Grid dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative z-10 space-y-0">
          {rows.map((row, rowIdx) => {
            const isLastRow = rowIdx === rows.length - 1;

            return (
              <Fragment key={rowIdx}>
                {/* Node row */}
                <div className="flex items-center">
                  {row.nodes.map((node, nodeIdx) => {
                    const currentGlobalIdx = globalIdx++;
                    const isFirst = nodeIdx === 0;
                    const isSkel = isSkeleton(node);
                    const isRevealed = isSkel || currentGlobalIdx < revealedCount || !animate;
                    const style = !isSkel ? STATUS_STYLES[node.status] || STATUS_STYLES.LOCKED : null;
                    const isSelected = !isSkel && selectedTopicId === node.id;
                    const isBeingGenerated = !isSkel && generatingTopicId === node.id;

                    // True sequence number (not reversed)
                    const seqNum = isSkel
                      ? node.sequenceOrder
                      : node.sequenceOrder;

                    return (
                      <Fragment key={node.id}>
                        {/* Horizontal connector (before every node except first) */}
                        {!isFirst && (
                          <div
                            className="canvas-connector-h flex-shrink-0 flex items-center"
                            style={{
                              animationDelay: animate ? `${currentGlobalIdx * 150 + 50}ms` : '0ms',
                            }}
                          >
                            <div className="w-6 lg:w-10 h-px border-t border-dashed border-accent-green/30 relative">
                              {/* Arrow tip */}
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 w-0 h-0 ${
                                  row.direction === 'ltr'
                                    ? 'right-0 border-l-[4px] border-l-accent-green/40 border-y-[3px] border-y-transparent'
                                    : 'left-0 border-r-[4px] border-r-accent-green/40 border-y-[3px] border-y-transparent'
                                }`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Node */}
                        <div
                          className={`
                            flex-shrink-0 w-[120px] lg:w-[140px] relative
                            ${isRevealed ? 'canvas-node-appear' : 'opacity-0'}
                            ${isBeingGenerated ? 'canvas-node-glow' : ''}
                          `}
                          style={{
                            animationDelay: animate ? `${currentGlobalIdx * 150}ms` : '0ms',
                          }}
                        >
                          {/* Pulse ring for generating state */}
                          {isBeingGenerated && (
                            <div className="absolute inset-0 rounded border border-accent-blue/30 canvas-pulse-ring pointer-events-none" />
                          )}

                          {isSkel ? (
                            /* Skeleton node */
                            <div className="canvas-skeleton rounded border border-border-primary p-3 h-[72px]">
                              <div className="h-2 w-6 bg-bg-active rounded mb-2" />
                              <div className="h-2 w-full bg-bg-active rounded mb-1.5" />
                              <div className="h-2 w-2/3 bg-bg-active rounded" />
                            </div>
                          ) : (
                            /* Real node */
                            <div
                              onClick={() => onTopicClick?.(node.id, node.status)}
                              className={`
                                rounded border p-3 h-[72px] flex flex-col justify-between
                                transition-all duration-200 group
                                ${style!.border} ${style!.bg}
                                ${node.status !== 'LOCKED' ? 'cursor-pointer hover:scale-[1.04] hover:shadow-lg hover:shadow-accent-green/5' : 'cursor-not-allowed opacity-60'}
                                ${isSelected ? 'ring-1 ring-accent-blue shadow-lg shadow-accent-blue/10 scale-[1.04]' : ''}
                              `}
                            >
                              {/* Top: number + status icon */}
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold ${style!.text}`}>
                                  {String(seqNum).padStart(2, '0')}
                                </span>
                                <span className={style!.text}>
                                  {style!.icon}
                                </span>
                              </div>

                              {/* Title */}
                              <p className="text-[11px] text-text-primary leading-tight truncate mt-1">
                                {node.title}
                              </p>

                              {/* Bottom: time estimate */}
                              <div className="flex items-center justify-between mt-auto">
                                {node.estimatedMinutes > 0 && (
                                  <span className="text-[9px] text-text-muted">
                                    {node.estimatedMinutes}m
                                  </span>
                                )}
                                <span className={`text-[9px] uppercase tracking-wider ${style!.text}`}>
                                  {node.status.toLowerCase().replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>

                {/* Vertical connector between rows */}
                {!isLastRow && (
                  <div
                    className={`flex ${row.direction === 'ltr' ? 'justify-end pr-[55px] lg:pr-[65px]' : 'justify-start pl-[55px] lg:pl-[65px]'}`}
                  >
                    <div
                      className="canvas-connector-v w-px h-6 border-l border-dashed border-accent-green/30 relative"
                      style={{
                        animationDelay: animate
                          ? `${(row.rowIndex + 1) * nodesPerRow * 150 - 50}ms`
                          : '0ms',
                      }}
                    >
                      {/* Down arrow */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-t-[4px] border-t-accent-green/40 border-x-[3px] border-x-transparent" />
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Generating terminal log */}
      {isGenerating && (
        <div className="mt-3 px-1">
          <div className="flex items-center gap-2 text-[11px] text-text-muted font-mono">
            <span className="text-accent-green">$</span>
            <span className="text-accent-green/70">{GENERATING_PHASES[phase]}</span>
            <span className="cursor-blink text-accent-green">_</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
            <span>model: glm5-reasoning</span>
            <span>|</span>
            <span>max_tokens: 16384</span>
            <span>|</span>
            <span>nodes: {visibleSkeletons}/~10</span>
          </div>
        </div>
      )}
    </div>
  );
}
