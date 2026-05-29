"use client";
import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MarqueeText({ text, className = "" }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [delta, setDelta] = useState(0); // how many px to scroll left

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const measure = () => {
      const overflow = textEl.scrollWidth - container.offsetWidth;
      setDelta(overflow > 4 ? overflow : 0);
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [text]);

  const isOverflowing = delta > 0;

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <motion.span
        ref={textRef}
        className="inline-block whitespace-nowrap will-change-transform"
        animate={
          isOverflowing
            ? {
                // pause → scroll left → pause → scroll right → pause
                x: [0, 0, -delta, -delta, 0],
              }
            : { x: 0 }
        }
        transition={
          isOverflowing
            ? {
                duration: 6,
                times: [0, 0.12, 0.55, 0.7, 1],
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 1.5,
              }
            : { duration: 0 }
        }
      >
        {text}
      </motion.span>
    </div>
  );
}
