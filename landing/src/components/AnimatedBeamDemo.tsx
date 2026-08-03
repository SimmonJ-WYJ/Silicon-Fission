import React, { forwardRef, useRef } from "react";
import { cn } from "../lib/utils";
import { AnimatedBeam } from "./ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex h-[400px] w-full items-center justify-center overflow-hidden"
      ref={containerRef}
    >
      <div className="flex size-full flex-col max-w-lg max-h-[280px] items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <Icons.claude />
          </Circle>
          <Circle ref={div5Ref}>
            <Icons.gemini />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Icons.gpt4 />
          </Circle>
          <Circle ref={div4Ref} className="size-16">
            <Icons.siliconfission />
          </Circle>
          <Circle ref={div6Ref}>
            <Icons.deepseek />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div3Ref}>
            <Icons.llama />
          </Circle>
          <Circle ref={div7Ref}>
            <Icons.mistral />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div4Ref}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={-75}
        endYOffset={-10}
        reverse
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div4Ref}
        reverse
        gradientStartColor="#1060FF"
        gradientStopColor="#5B8DEF"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div4Ref}
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
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#1060FF"/>
      <text x="50" y="58" fontSize="36" fill="white" textAnchor="middle" fontWeight="bold">SF</text>
    </svg>
  ),
  claude: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#CC9B7A"/>
      <path d="M30 70L50 30L70 70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  gpt4: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#10A37F"/>
      <path d="M50 25V75M25 50H75" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    </svg>
  ),
  gemini: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#4285F4"/>
      <path d="M35 50L50 35L65 50L50 65Z" fill="white"/>
    </svg>
  ),
  llama: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#0467DF"/>
      <text x="50" y="62" fontSize="32" fill="white" textAnchor="middle" fontWeight="bold">LL</text>
    </svg>
  ),
  deepseek: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#1C1C1E"/>
      <circle cx="50" cy="50" r="20" fill="white"/>
    </svg>
  ),
  mistral: () => (
    <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" fill="#F2A73B"/>
      <path d="M40 40L50 30L60 40L50 50Z" fill="white"/>
      <path d="M40 60L50 50L60 60L50 70Z" fill="white"/>
    </svg>
  ),
};
