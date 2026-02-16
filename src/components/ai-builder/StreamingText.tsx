import { useState, useEffect, useRef, useMemo } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // ms per character batch
  children: (displayedContent: string) => React.ReactNode;
}

/**
 * Smooth token-by-token typewriter for streaming AI responses.
 * Catches up to real content naturally — fast when chunks arrive quickly,
 * smooth when they're slow. Shows full content instantly when streaming ends.
 */
export function StreamingText({ content, isStreaming, speed = 4, children }: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);
  const targetLenRef = useRef(0);

  // Track target length
  targetLenRef.current = content.length;

  useEffect(() => {
    if (!isStreaming) {
      // Show full content immediately when not streaming
      setDisplayedLength(content.length);
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= speed) {
        lastTickRef.current = timestamp;
        setDisplayedLength(prev => {
          if (prev >= targetLenRef.current) return prev;
          // Dynamic step: catch up faster when far behind, slow when close
          const gap = targetLenRef.current - prev;
          const step = gap > 100 ? Math.ceil(gap * 0.3) : gap > 20 ? Math.ceil(gap * 0.15) : Math.max(1, Math.ceil(gap * 0.1));
          return Math.min(prev + step, targetLenRef.current);
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isStreaming, speed, content]);

  // When streaming ends, snap to full content
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedLength(content.length);
    }
  }, [isStreaming, content.length]);

  const displayed = isStreaming ? content.slice(0, displayedLength) : content;
  return <>{children(displayed)}</>;
}

/**
 * Blinking cursor that appears at the end of streaming text
 */
export function StreamingCursor({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span 
      className="inline-block w-[2px] h-[1.1em] bg-cyan-400 ml-0.5 align-text-bottom rounded-full"
      style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
    />
  );
}

/**
 * Elapsed time counter for generation
 */
export function ElapsedTimer({ isActive }: { isActive: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    startRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive || elapsed < 2) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const display = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  return (
    <span className="text-[9px] text-white/20 font-mono tabular-nums">{display}</span>
  );
}
