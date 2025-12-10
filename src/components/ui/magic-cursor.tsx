"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
}

interface MagicCursorProps {
  colors?: string[];
  animationDuration?: number;
  minimumTimeBetweenParticles?: number;
  minimumDistanceBetweenParticles?: number;
  cursorSize?: number;
  className?: string;
}

const MagicCursor = ({
  colors = ["#D946EF", "#A855F7", "#8B5CF6", "#60A5FA", "#3B82F6", "#4285F4"], // Added Google Blue
  animationDuration = 1000, // Faster, snappier for futuristic feel
  minimumTimeBetweenParticles = 8, // High density
  minimumDistanceBetweenParticles = 6,
  cursorSize = 12,
  className,
}: MagicCursorProps) => {
  const configRef = React.useRef({
    animationDuration,
    minimumTimeBetweenParticles,
    minimumDistanceBetweenParticles,
    colors,
  });

  const cursorRef = React.useRef<HTMLDivElement>(null);

  const lastRef = React.useRef({
    timestamp: 0, // Initialize to 0 to ensure first move triggers
    position: { x: 0, y: 0 },
    mousePosition: { x: 0, y: 0 },
  });

  // Define create functions with useCallback
  const createParticle = React.useCallback(
    (position: Point) => {
      // Safety check for browser environment
      if (typeof document === 'undefined') return;

      const wrapper = document.createElement("div");
      const color = selectRandom(configRef.current.colors);

      const width = rand(10, 20); // Bigger particles again
      const height = rand(4, 8);
      const rotation = rand(0, 360);

      // Super high z-index to ensure visibility
      wrapper.className = cn("fixed pointer-events-none", className);
      wrapper.style.zIndex = "100000";
      wrapper.style.left = `${position.x}px`;
      wrapper.style.top = `${position.y}px`;
      wrapper.style.width = `${width}px`;
      wrapper.style.height = `${height}px`;
      wrapper.style.backgroundColor = color;
      wrapper.style.borderRadius = "4px"; // Rounded again for pill shape

      // Animation parameters
      const initialTransform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;
      // Gravity physics parameters
      const gravityY = rand(100, 200); // Stronger fall distance
      const driftX = 0; // Strict downward movement

      wrapper.style.transform = initialTransform;

      // Gravity animation: Accelerate downwards
      const animation = wrapper.animate(
        [
          { transform: initialTransform, opacity: 1, offset: 0 },
          { transform: `translate(-50%, -50%) rotate(${rotation + rand(-20, 20)}deg) translate(${driftX * 0.2}px, ${gravityY * 0.2}px) scale(0.9)`, opacity: 0.8, offset: 0.4 }, // Start falling
          { transform: `translate(-50%, -50%) rotate(${rotation + rand(-60, 60)}deg) translate(${driftX}px, ${gravityY}px) scale(0)`, opacity: 0, offset: 1 } // Accelerate end
        ],
        {
          duration: configRef.current.animationDuration,
          easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)", // Custom gravity curve
          fill: "forwards"
        }
      );

      animation.onfinish = () => {
        if (wrapper && document.body.contains(wrapper)) {
          document.body.removeChild(wrapper);
        }
      };

      document.body.appendChild(wrapper);
    },
    [className]
  );

  const handleOnMove = React.useCallback(
    (e: { clientX: number; clientY: number }) => {
      const mousePosition = { x: e.clientX, y: e.clientY };

      if (cursorRef.current) {
        const isHovering = cursorRef.current.dataset.hover === "true";
        const scale = isHovering ? "scale(1.5)" : "scale(1)";
        cursorRef.current.style.transform = `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) ${scale}`;
      }

      const now = new Date().getTime();
      const hasMovedFarEnough =
        calcDistance(lastRef.current.position, mousePosition) >=
        configRef.current.minimumDistanceBetweenParticles;
      const hasBeenLongEnough =
        now - lastRef.current.timestamp >
        configRef.current.minimumTimeBetweenParticles;

      if (hasMovedFarEnough || hasBeenLongEnough) {
        createParticle(mousePosition);

        lastRef.current.timestamp = now;
        lastRef.current.position = mousePosition;
      }

      lastRef.current.mousePosition = mousePosition;
    },
    [createParticle]
  );

  React.useEffect(() => {
    // Hide default cursor
    document.documentElement.style.cursor = "none";
    document.body.style.cursor = "none";

    // Force specific cursor on all elements just in case
    const style = document.createElement('style');
    style.innerHTML = `* { cursor: none !important; }`;
    style.id = "cursor-style";
    document.head.appendChild(style);

    window.addEventListener("mousemove", handleOnMove);
    window.addEventListener("touchmove", (e) => handleOnMove(e.touches[0]));

    // Hover state handling
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if element is clickable
      const isClickable =
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'input' ||
        target.tagName.toLowerCase() === 'textarea' ||
        target.tagName.toLowerCase() === 'select' ||
        target.closest('a') ||
        target.closest('button') ||
        window.getComputedStyle(target).cursor === 'pointer';

      if (isClickable && cursorRef.current) {
        cursorRef.current.style.transform += " scale(1.5)";
        cursorRef.current.dataset.hover = "true";
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (cursorRef.current && cursorRef.current.dataset.hover === "true") {
        const mousePosition = lastRef.current.mousePosition;
        cursorRef.current.style.transform = `translate3d(${mousePosition.x}px, ${mousePosition.y}px, 0) scale(1)`;
        cursorRef.current.dataset.hover = "false";
      }
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    const handleLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "0";
    };
    const handleEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = "1";
    };

    document.body.addEventListener("mouseleave", handleLeave);
    document.body.addEventListener("mouseenter", handleEnter);

    return () => {
      document.documentElement.style.cursor = "";
      document.body.style.cursor = "";
      const styleEl = document.getElementById("cursor-style");
      if (styleEl) styleEl.remove();

      window.removeEventListener("mousemove", handleOnMove);
      window.removeEventListener("touchmove", (e) => handleOnMove(e.touches[0]));
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      document.body.removeEventListener("mouseleave", handleLeave);
      document.body.removeEventListener("mouseenter", handleEnter);
    };
  }, [handleOnMove]);

  return (
    <div
      ref={cursorRef}
      className={cn(
        "fixed top-0 left-0 rounded-full pointer-events-none transition-opacity duration-300",
        className
      )}
      style={{
        width: cursorSize,
        height: cursorSize,
        backgroundColor: "#D946EF",
        boxShadow: "0 0 15px rgba(217, 70, 239, 0.6)",
        marginTop: -cursorSize / 2,
        marginLeft: -cursorSize / 2,
        zIndex: 100001, // Highest priority
        willChange: "transform",
      }}
    />
  );
};

// Utils
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function selectRandom<T>(items: T[]): T {
  return items[rand(0, items.length - 1)];
}

function calcDistance(a: Point, b: Point) {
  const diffX = b.x - a.x;
  const diffY = b.y - a.y;
  return Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
}

export { MagicCursor };
