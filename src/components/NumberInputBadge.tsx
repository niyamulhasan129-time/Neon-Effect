/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface NumberInputBadgeProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
  widthClass?: string;
}

export const NumberInputBadge: React.FC<NumberInputBadgeProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  className = '',
  widthClass = 'w-11',
}) => {
  const [localVal, setLocalVal] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalVal(String(value));
    }
  }, [value, isFocused]);

  const commitValue = (valStr: string) => {
    let num = parseFloat(valStr);
    if (isNaN(num)) {
      setLocalVal(String(value));
      return;
    }
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    if (step && step < 1) {
      const precision = step.toString().split('.')[1]?.length || 1;
      num = parseFloat(num.toFixed(precision));
    }
    setLocalVal(String(num));
    onChange(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue(localVal);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseFloat(localVal) || value;
      commitValue(String(current + step));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(localVal) || value;
      commitValue(String(current - step));
    }
  };

  return (
    <div
      className={`inline-flex items-center px-1.5 py-0.5 bg-slate-950 rounded border transition-colors ${
        isFocused
          ? 'border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.35)]'
          : 'border-slate-800 hover:border-slate-700'
      } ${className}`}
      title="সংখ্যাটি নিজের হাতে লিখে পরিবর্তন করুন (Click to type number)"
    >
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={localVal}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.select();
        }}
        onBlur={() => {
          setIsFocused(false);
          commitValue(localVal);
        }}
        onChange={(e) => {
          setLocalVal(e.target.value);
          const parsed = parseFloat(e.target.value);
          if (!isNaN(parsed)) {
            if ((min === undefined || parsed >= min) && (max === undefined || parsed <= max)) {
              onChange(parsed);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={`${widthClass} bg-transparent text-right font-mono text-[11px] font-bold text-cyan-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none cursor-text select-text`}
      />
      {unit && (
        <span className="font-mono text-[10px] text-slate-400 ml-0.5 select-none pointer-events-none">
          {unit}
        </span>
      )}
    </div>
  );
};
