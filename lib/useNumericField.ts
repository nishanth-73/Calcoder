"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export function useNumericField(defaultValue: number = 0) {
  const [numVal, setNumVal] = useState(defaultValue);
  const [strVal, setStrVal] = useState(String(defaultValue));
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setStrVal(String(numVal));
    }
  }, [numVal]);

  const handleChange = useCallback((raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setStrVal(cleaned);
    if (cleaned !== "" && cleaned !== ".") {
      const parsed = parseFloat(cleaned);
      if (Number.isFinite(parsed) && parsed >= 0) {
        setNumVal(parsed);
      }
    }
  }, []);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
    setStrVal(String(numVal));
  }, [numVal]);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    const cleaned = strVal.replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") {
      setStrVal(String(numVal));
      return;
    }
    const parsed = parseFloat(cleaned);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setNumVal(parsed);
      setStrVal(String(parsed));
    } else {
      setStrVal(String(numVal));
    }
  }, [strVal, numVal]);

  const setValue = useCallback((val: number) => {
    if (Number.isFinite(val) && val >= 0) {
      setNumVal(val);
      setStrVal(String(val));
    }
  }, []);

  return {
    value: numVal,
    displayValue: strVal,
    setValue,
    handleChange,
    handleFocus,
    handleBlur,
  };
}
