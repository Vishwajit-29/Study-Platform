import { useState, useEffect } from 'react';
import { Cpu, Loader2 } from 'lucide-react';

interface TerminalLoaderProps {
  /** Array of status lines to cycle through */
  lines?: string[];
  /** Milliseconds between line changes (default: 3000) */
  interval?: number;
  /** Title shown at top (default: 'processing') */
  title?: string;
  /** Short subtitle / context */
  subtitle?: string;
  /** Whether to show the spinner icon (default: true) */
  showSpinner?: boolean;
  /** Whether to show the model info footer (default: true) */
  showModelInfo?: boolean;
  /** Additional CSS class */
  className?: string;
}

const DEFAULT_LINES = [
  'initializing AI model...',
  'connecting to inference engine...',
  'preparing context window...',
  'generating response...',
  'processing tokens...',
  'building output...',
];

export default function TerminalLoader({
  lines = DEFAULT_LINES,
  interval = 3000,
  title = 'processing',
  subtitle,
  showSpinner = true,
  showModelInfo = true,
  className = '',
}: TerminalLoaderProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Cycle through lines
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLine((prev) => (prev + 1) % lines.length);
    }, interval);
    return () => clearInterval(timer);
  }, [lines.length, interval]);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return min > 0
      ? `${min}m ${sec.toString().padStart(2, '0')}s`
      : `${sec}s`;
  };

  return (
    <div className={`border border-border-primary rounded bg-bg-secondary ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-primary">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-orange opacity-70 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-accent-green opacity-50" />
          <span className="w-2 h-2 rounded-full bg-bg-active" />
        </div>
        <span className="text-[11px] text-text-muted ml-1">{title}</span>
        {subtitle && (
          <>
            <span className="text-text-muted text-[11px]">--</span>
            <span className="text-[11px] text-text-secondary">{subtitle}</span>
          </>
        )}
        <span className="text-[11px] text-text-muted ml-auto">
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-2">
        {/* Spinner + current phase */}
        <div className="flex items-center gap-2.5">
          {showSpinner ? (
            <Loader2 size={13} className="text-accent-green spinner" />
          ) : (
            <Cpu size={13} className="text-accent-green" />
          )}
          <span className="text-xs text-accent-green font-medium">
            {lines[currentLine]}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1 pl-[23px]">
          {lines.map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full transition-colors duration-300 ${
                i <= currentLine ? 'bg-accent-green' : 'bg-bg-active'
              }`}
            />
          ))}
        </div>

        {/* Blinking cursor line */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted pl-[23px]">
          <span className="text-accent-green">$</span>
          <span className="text-accent-green/60">{lines[currentLine]}</span>
          <span className="cursor-blink text-accent-green">_</span>
        </div>
      </div>

      {/* Footer */}
      {showModelInfo && (
        <div className="flex items-center gap-4 px-4 py-2 border-t border-border-primary text-[10px] text-text-muted">
          <span>model: glm5-reasoning</span>
          <span>|</span>
          <span>max_tokens: 16384</span>
          <span>|</span>
          <span>timeout: 300s</span>
        </div>
      )}
    </div>
  );
}
