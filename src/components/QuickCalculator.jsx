'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calculator as CalcIcon,
  X,
  Copy,
  Check,
  Delete,
  CornerDownLeft,
  Percent,
  Divide,
  Minus,
  Plus,
  Equal
} from 'lucide-react';

export default function QuickCalculator({ isOpen, onClose }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [copied, setCopied] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleNumber(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        const opMap = { '*': '×', '/': '÷', '+': '+', '-': '−' };
        handleOperator(opMap[e.key] || e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key.toLowerCase() === 'c') {
        handleClear();
      } else if (e.key === '%') {
        handlePercent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display, equation]);

  const handleNumber = (num) => {
    if (equation.includes('=')) {
      setEquation('');
      setDisplay(num);
      return;
    }
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(prev => prev + num);
    }
  };

  const handleDecimal = () => {
    if (equation.includes('=')) {
      setEquation('');
      setDisplay('0.');
      return;
    }
    if (display === 'Error') {
      setDisplay('0.');
      return;
    }
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleOperator = (op) => {
    if (display === 'Error') return;
    try {
      if (equation && equation.includes('=')) {
        setEquation(`${display} ${op} `);
        setDisplay('0');
        return;
      }
      if (equation) {
        const parts = equation.trim().split(' ');
        if (parts.length >= 2 && display !== '0') {
          // Chain operation
          const fullExpr = equation + display;
          const evalExpr = fullExpr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-');
          // eslint-disable-next-line no-new-func
          const result = Function(`'use strict'; return (${evalExpr})`)();
          const formatted = Number.isFinite(result)
            ? String(Math.round(result * 100000000) / 100000000)
            : 'Error';
          setEquation(`${formatted} ${op} `);
          setDisplay('0');
          return;
        } else if (parts.length >= 1) {
          // Change operator
          setEquation(`${parts[0]} ${op} `);
          return;
        }
      }
      setEquation(`${display} ${op} `);
      setDisplay('0');
    } catch {
      setDisplay('Error');
    }
  };

  const handleCalculate = () => {
    if (!equation || display === 'Error' || equation.includes('=')) return;
    try {
      const fullExpr = equation + display;
      // Sanitize and replace display operators with JS operators
      const evalExpr = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-');

      // Safe mathematical calculation
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${evalExpr})`)();
      const formatted = Number.isFinite(result)
        ? String(Math.round(result * 100000000) / 100000000)
        : 'Error';

      setEquation(`${fullExpr} =`);
      setDisplay(formatted);
    } catch {
      setDisplay('Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleBackspace = () => {
    if (equation.includes('=')) {
      setEquation('');
      return;
    }
    if (display === 'Error' || display.length <= 1) {
      setDisplay('0');
    } else {
      setDisplay(prev => prev.slice(0, -1));
    }
  };

  const handlePercent = () => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    if (isNaN(val)) return;

    if (equation && !equation.includes('=')) {
      // Equation format is typically "1000 + " or "1000 − " or "1000 × " or "1000 ÷ "
      const parts = equation.trim().split(' ');
      if (parts.length >= 2) {
        const baseNum = parseFloat(parts[0]);
        const op = parts[1];

        if (!isNaN(baseNum)) {
          if (op === '+' || op === '−') {
            // e.g. 1000 − 10% -> 10% of 1000 is 100
            const percentVal = (baseNum * val) / 100;
            setDisplay(String(Math.round(percentVal * 100000000) / 100000000));
            return;
          } else if (op === '×' || op === '÷') {
            // e.g. 1000 × 10% -> 0.1
            const percentVal = val / 100;
            setDisplay(String(Math.round(percentVal * 100000000) / 100000000));
            return;
          }
        }
      }
    }

    // Default standalone percentage (divide by 100)
    const result = val / 100;
    setDisplay(String(Math.round(result * 100000000) / 100000000));
  };

  const handleToggleSign = () => {
    if (display === '0' || display === 'Error') return;
    if (display.startsWith('-')) {
      setDisplay(display.substring(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(display);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className="bg-slate-900 text-white w-full max-w-[320px] rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 select-none">
          <div className="flex items-center space-x-2 text-indigo-400">
            <CalcIcon size={16} />
            <span className="text-xs font-bold text-slate-200">POS Quick Calculator</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Display Screen */}
        <div className="p-4 bg-slate-950/80 text-right select-all border-b border-slate-800/80">
          <div className="text-[11px] text-slate-400 font-mono min-h-[16px] truncate">
            {equation || '\u00A0'}
          </div>
          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 transition text-[10px] flex items-center space-x-1"
              title="Copy Result"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <div className="text-2xl font-mono font-bold text-white tracking-tight truncate max-w-[200px]">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2 bg-slate-900 font-bold select-none text-sm">
          {/* Row 1 */}
          <button
            type="button"
            onClick={handleClear}
            className="p-3 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-2xl active:scale-95 transition"
          >
            AC
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-3 bg-slate-800 text-slate-300 hover:bg-slate-700/80 rounded-2xl active:scale-95 transition flex items-center justify-center"
            title="Backspace"
          >
            <Delete size={16} />
          </button>
          <button
            type="button"
            onClick={handlePercent}
            className="p-3 bg-slate-800 text-slate-300 hover:bg-slate-700/80 rounded-2xl active:scale-95 transition flex items-center justify-center"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-xs"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            type="button"
            onClick={() => handleNumber('7')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            7
          </button>
          <button
            type="button"
            onClick={() => handleNumber('8')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            8
          </button>
          <button
            type="button"
            onClick={() => handleNumber('9')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            9
          </button>
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-xs"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            type="button"
            onClick={() => handleNumber('4')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            4
          </button>
          <button
            type="button"
            onClick={() => handleNumber('5')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            5
          </button>
          <button
            type="button"
            onClick={() => handleNumber('6')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            6
          </button>
          <button
            type="button"
            onClick={() => handleOperator('−')}
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-xs"
          >
            −
          </button>

          {/* Row 4 */}
          <button
            type="button"
            onClick={() => handleNumber('1')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            1
          </button>
          <button
            type="button"
            onClick={() => handleNumber('2')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            2
          </button>
          <button
            type="button"
            onClick={() => handleNumber('3')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            3
          </button>
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="p-3 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-xs"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            type="button"
            onClick={handleToggleSign}
            className="p-3 bg-slate-800 text-slate-300 hover:bg-slate-700/80 rounded-2xl active:scale-95 transition text-xs"
          >
            ±
          </button>
          <button
            type="button"
            onClick={() => handleNumber('0')}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDecimal}
            className="p-3 bg-slate-800/70 text-white hover:bg-slate-700 rounded-2xl active:scale-95 transition"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleCalculate}
            className="p-3 bg-emerald-600 text-white hover:bg-emerald-500 rounded-2xl active:scale-95 transition flex items-center justify-center shadow-md shadow-emerald-600/30"
          >
            =
          </button>
        </div>

        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 text-center text-[10px] text-slate-500">
          Keyboard shortcuts active (0-9, +, -, *, /, Enter, Esc)
        </div>
      </div>
    </div>
  );
}
