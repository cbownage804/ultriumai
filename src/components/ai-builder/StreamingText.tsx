import { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // ms per character
  children: (displayedContent: string) => React.ReactNode;
}

/**
 * Token-by-token typewriter animation for streaming AI responses.
 * When isStreaming is true, it animates new content character by character.
 * When isStreaming is false, it shows the full content immediately.
 */
export function StreamingText({ content, isStreaming, speed = 8, children }: StreamingTextProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const prevContentLenRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    if (!isStreaming) {
      // Show full content immediately when not streaming
      setDisplayedLength(content.length);
      prevContentLenRef.current = content.length;
      return;
    }

    // If new content arrived, animate from where we left off
    const animate = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= speed) {
        lastTickRef.current = timestamp;
        setDisplayedLength(prev => {
          if (prev >= content.length) return prev;
          // Advance by 1-3 chars for natural feel
          const step = Math.min(3, content.length - prev);
          return prev + step;
        });
      }

      if (displayedLength < content.length) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [content, isStreaming, speed, displayedLength]);

  // When content grows (new tokens arrive), keep animating
  useEffect(() => {
    if (isStreaming && content.length > prevContentLenRef.current) {
      prevContentLenRef.current = content.length;
    }
  }, [content.length, isStreaming]);

  const displayed = isStreaming ? content.slice(0, displayedLength) : content;

  return <>{children(displayed)}</>;
}

/**
 * Blinking cursor that appears at the end of streaming text
 */
export function StreamingCursor({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span className="inline-block w-[2px] h-[1em] bg-cyan-400 ml-0.5 animate-pulse align-text-bottom" />
  );
}
