import React, { forwardRef, useRef } from "react";
import { cn } from "../lib/utils";
import { AnimatedBeam } from "./ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode; style?: React.CSSProperties }
>(({ className, children, style }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
      style={{ width: '48px', height: '48px', ...style }}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function ModelConnectionDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);
  const claudeRef = useRef<HTMLDivElement>(null);
  const gptRef = useRef<HTMLDivElement>(null);
  const geminiRef = useRef<HTMLDivElement>(null);
  const llamaRef = useRef<HTMLDivElement>(null);
  const deepseekRef = useRef<HTMLDivElement>(null);
  const mistralRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden"
      style={{ height: '400px' }}
      ref={containerRef}
    >
      <div
        className="flex flex-col items-stretch justify-between"
        style={{
          width: '100%',
          maxWidth: '600px',
          height: '280px',
          gap: '40px'
        }}
      >
        <div className="flex flex-row items-center justify-between">
          <Circle ref={claudeRef}>
            <Icons.claude />
          </Circle>
          <Circle ref={geminiRef}>
            <Icons.gemini />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={gptRef}>
            <Icons.gpt4 />
          </Circle>
          <Circle ref={apiRef} style={{ width: '64px', height: '64px' }}>
            <Icons.siliconfission />
          </Circle>
          <Circle ref={deepseekRef}>
            <Icons.deepseek />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={llamaRef}>
            <Icons.llama />
          </Circle>
          <Circle ref={mistralRef}>
            <Icons.mistral />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={claudeRef}
        toRef={apiRef}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gptRef}
        toRef={apiRef}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={llamaRef}
        toRef={apiRef}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={geminiRef}
        toRef={apiRef}
        curvature={-75}
        endYOffset={-10}
        reverse
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={deepseekRef}
        toRef={apiRef}
        reverse
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={mistralRef}
        toRef={apiRef}
        curvature={75}
        endYOffset={10}
        reverse
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
    </div>
  );
}

const Icons = {
  siliconfission: () => (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#1060FF"/>
      <text x="50" y="60" fontSize="38" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="system-ui">SF</text>
    </svg>
  ),
  claude: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#CC9B7A"/>
      <path d="M30 70L50 30L70 70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  gpt4: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#10A37F"/>
      <path d="M50 25V75M25 50H75" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  gemini: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#4285F4"/>
      <path d="M35 50L50 35L65 50L50 65Z" fill="white"/>
    </svg>
  ),
  llama: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#0467DF"/>
      <text x="50" y="62" fontSize="28" fill="white" textAnchor="middle" fontWeight="bold" fontFamily="system-ui">LL</text>
    </svg>
  ),
  deepseek: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#1C1C1E"/>
      <circle cx="50" cy="50" r="20" fill="white"/>
    </svg>
  ),
  mistral: () => (
    <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#F2A73B"/>
      <path d="M40 40L50 30L60 40L50 50Z" fill="white"/>
      <path d="M40 60L50 50L60 60L50 70Z" fill="white"/>
    </svg>
  ),
};
