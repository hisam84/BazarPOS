'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, Zap, ZapOff, CheckCircle2, AlertCircle } from 'lucide-react';

// Web Audio API beep synthesizer for instant feedback on scan
const playBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200 Hz beep
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.12);
  } catch (e) {
    // Audio context not allowed or blocked
  }
};

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  continuous = false,
  title = 'Mobile Barcode Scanner'
}) {
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const scannerRef = useRef(null);
  const readerElementId = 'bazarpos-camera-barcode-reader';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    let isMounted = true;
    setErrorMsg('');
    setLastScanned('');

    const startScanner = async () => {
      try {
        const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.ITF
        ];

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport,
          verbose: false
        });
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.75;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: Math.min(320, qrboxSize),
              height: Math.min(180, Math.floor(qrboxSize * 0.6))
            };
          },
          aspectRatio: 1.333334
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText, decodedResult) => {
            if (!isMounted) return;
            playBeep();
            setLastScanned(decodedText);

            if (onScanSuccess) {
              onScanSuccess(decodedText, decodedResult);
            }

            if (!continuous) {
              stopScanner();
              if (onClose) onClose();
            }
          },
          (errorMessage) => {
            // Scanning progress frame error (ignored to avoid spam)
          }
        );

        if (isMounted) {
          setIsScanning(true);
          // Check if torch/flashlight is supported
          try {
            const capabilities = html5QrCode.getRunningTrackCapabilities();
            if (capabilities && capabilities.torch) {
              setHasTorch(true);
            }
          } catch (e) {}
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Camera Scanner Error:', err);
        if (err.name === 'NotAllowedError' || err.toString().includes('NotAllowedError')) {
          setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError' || err.toString().includes('NotFoundError')) {
          setErrorMsg('No camera found on this device.');
        } else {
          setErrorMsg('Could not open camera. Please ensure HTTPS or localhost is active and no other app is using the camera.');
        }
      }
    };

    // Short timeout so the DOM container exists
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, continuous]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // Ignore stop error
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setTorchOn(false);
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-white my-auto animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
              <p className="text-[11px] text-slate-400">Point mobile camera directly at the barcode</p>
            </div>
          </div>

          <button
            onClick={() => {
              stopScanner();
              if (onClose) onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera Viewport Body */}
        <div className="p-4 flex flex-col items-center justify-center relative bg-slate-950">
          {errorMsg ? (
            <div className="py-12 px-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertCircle size={24} />
              </div>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg('');
                  setIsScanning(false);
                  stopScanner();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition inline-flex items-center space-x-1.5"
              >
                <RefreshCw size={13} />
                <span>Try Again</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full overflow-hidden rounded-2xl bg-black border border-slate-800 flex items-center justify-center min-h-[260px] sm:min-h-[280px]">
              {/* HTML5 QR Code Container */}
              <div id={readerElementId} className="w-full h-full" />

              {/* Animated Laser Scanning Line Overlay */}
              {isScanning && (
                <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-28 border-2 border-indigo-500/60 rounded-xl flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444] animate-pulse" />
                </div>
              )}
            </div>
          )}

          {/* Flashlight Torch & Controls */}
          {hasTorch && isScanning && (
            <div className="absolute bottom-6 right-6 z-10">
              <button
                onClick={toggleTorch}
                className={`p-3 rounded-2xl font-semibold shadow-lg transition flex items-center space-x-1.5 text-xs ${
                  torchOn
                    ? 'bg-amber-400 text-slate-950 shadow-amber-400/30'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Torch / Flashlight"
              >
                {torchOn ? <Zap size={16} /> : <ZapOff size={16} />}
              </button>
            </div>
          )}
        </div>

        {/* Footer info & last scanned badge */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          {lastScanned ? (
            <div className="flex items-center space-x-2 text-emerald-400 truncate w-full sm:w-auto">
              <CheckCircle2 size={15} className="shrink-0" />
              <span className="font-mono font-bold truncate">Scanned: {lastScanned}</span>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 text-center sm:text-left">
              Supports EAN-13, Code 128, UPC, and QR Codes
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              stopScanner();
              if (onClose) onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition text-xs text-center"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}
