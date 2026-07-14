import React, { useState, useRef } from 'react';

interface CopyableTextProps {
  text: string;
  children: React.ReactNode;
  className?: string;
}

export function CopyableText({ text, children, className = "" }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<any>(null);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default context menu triggers on mobile
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            // Fallback for older browsers
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
      }
    }, 600);
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className={`relative cursor-pointer transition-all active:scale-[0.99] select-none ${className} ${
        copied ? 'bg-indigo-500/10 rounded px-1' : ''
      }`}
      title="Mantén presionado para copiar"
    >
      {children}
      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 border border-indigo-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-bounce z-50">
          ¡Copiado!
        </span>
      )}
    </div>
  );
}
