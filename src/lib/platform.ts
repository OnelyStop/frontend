"use client";

import { useEffect, useState } from "react";

export function useModifierKey(): string {
  const [key, setKey] = useState("Ctrl");

  useEffect(() => {
    const apple = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    setKey(apple ? "⌘" : "Ctrl");
  }, []);

  return key;
}
