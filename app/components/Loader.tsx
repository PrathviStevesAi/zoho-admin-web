import React, { useState, useEffect } from "react";

export default function Loader() {
  const text = "FAST GUARD";
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFilledCount((prev) => {
        // Add a slight pause when fully filled before restarting
        if (prev > text.length + 2) {
          return 0;
        }
        return prev + 1;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [text.length]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
      <div className="flex space-x-1 md:space-x-2">
        {text.split("").map((char, index) => {
          if (char === " ") {
            return <span key={index} className="w-3 md:w-6"></span>;
          }
          const isFilled = index < filledCount;
          return (
            <span
              key={index}
              className="text-3xl md:text-5xl font-extrabold tracking-wider transition-all duration-75"
              style={{
                WebkitTextStroke: "2px #FFD700",
                WebkitTextFillColor: isFilled ? "#FFD700" : "transparent",
                color: isFilled ? "#FFD700" : "transparent",
                fontFamily: "'Arial Black', 'Impact', sans-serif",
                filter: isFilled ? "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" : "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))",
              }}
            >
              {char}
            </span>
          );
        })}
      </div>
    </div>
  );
}
