"use client";

import { useEffect, useRef, useState } from "react";

export default function useDebounceValue(val: string, delay: number = 500) {
  const [value, setValue] = useState(val);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setValue(val);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [val, delay]);

  return value;
}
