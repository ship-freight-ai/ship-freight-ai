import { useEffect, useState } from "react";

export const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / scrollHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener("scroll", updateScrollProgress);
    updateScrollProgress();

    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-muted z-[60]">
      <div
        className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 via-blue-500 to-cyan-500 transition-all duration-150 shadow-[0_0_10px_rgba(217,70,239,0.4)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};
