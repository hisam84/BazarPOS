'use client';

import React from 'react';

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export function generateCode128Bars(text) {
  if (!text) text = '000000';
  
  // Clean ASCII characters 32-126
  let cleanText = '';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 32 && code <= 126) {
      cleanText += text[i];
    } else {
      cleanText += '-';
    }
  }

  if (cleanText.length === 0) cleanText = '000000';

  const START_B = 104;
  const STOP = 106;

  const codes = [START_B];
  let checksum = START_B;

  for (let i = 0; i < cleanText.length; i++) {
    const val = cleanText.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }

  const checkVal = checksum % 103;
  codes.push(checkVal);
  codes.push(STOP);

  const bars = [];
  let currentX = 10; // Left quiet zone

  codes.forEach((codeIdx) => {
    const pattern = CODE128_PATTERNS[codeIdx] || "212222";
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      if (isBar) {
        bars.push({ x: currentX, width });
      }
      currentX += width;
    }
  });

  const totalWidth = currentX + 10; // Right quiet zone

  return { bars, totalWidth, text: cleanText };
}

export default function BarcodeSvg({
  value = '',
  height = 42,
  showText = true,
  className = '',
  barColor = '#000000'
}) {
  const { bars, totalWidth, text } = generateCode128Bars(value || '000000');

  return (
    <div className={`inline-flex flex-col items-center justify-center bg-white select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-full h-auto block"
        style={{ minHeight: `${height}px`, maxHeight: `${height * 1.5}px` }}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width={totalWidth} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect
            key={idx}
            x={bar.x}
            y="0"
            width={bar.width}
            height={height}
            fill={barColor}
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] tracking-wider text-slate-900 font-bold mt-1 text-center block">
          {value || text}
        </span>
      )}
    </div>
  );
}
