import React, { useRef, useState, useEffect } from 'react';
import { Order, ProofOfDelivery } from '../../types';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  PenTool,
  Camera,
  KeyRound,
  RotateCcw,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface ProofOfDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onCompleteDelivery: (orderId: string, pod: ProofOfDelivery) => void;
}

export const ProofOfDeliveryModal: React.FC<ProofOfDeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  onCompleteDelivery,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      setRecipientName(order.customer.name);
      setOtpCode('');
      setIsOtpVerified(false);
      setNotes('');
      setPhotoPreview(null);
      setHasSignature(false);

      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#1E5B44';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
          }
        }
      }, 100);
    }
  }, [isOpen, order]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
    }
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerifyOtp = () => {
    if (otpCode.length >= 4) {
      setIsOtpVerified(true);
    } else {
      alert('Please enter a valid 4-digit customer confirmation code.');
    }
  };

  const handleConfirm = () => {
    if (!order) return;

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : undefined;

    const pod: ProofOfDelivery = {
      id: `pod-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recipientName: recipientName || order.customer.name,
      signatureDataUrl: hasSignature ? signatureDataUrl : undefined,
      photoUrl: photoPreview || undefined,
      notes: notes || undefined,
      isOtpVerified: isOtpVerified,
    };

    onCompleteDelivery(order.id, pod);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-3xl shadow-modal p-6 text-zinc-900 dark:text-zinc-100 max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-black dark:hover:text-white rounded-xl hover:bg-[#F4F7F5] dark:hover:bg-[#182E25] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1E5B44] text-white rounded-2xl flex items-center justify-center font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#F7A838]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#111C16] dark:text-white">Proof of Delivery</h2>
            <p className="text-xs text-[#6C7D74]">
              Order #{order.orderNumber} • {order.customer.name}
            </p>
          </div>
        </div>

        {/* Recipient Name */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Recipient Name *
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
          />
        </div>

        {/* Digital Signature Pad */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-[#238B5E]" />
              Recipient Signature
            </label>
            <button
              onClick={clearSignature}
              className="text-[11px] text-[#6C7D74] hover:text-[#111C16] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
          <div className="border-2 border-dashed border-[#D8E2DC] dark:border-[#1F3A2E] rounded-2xl overflow-hidden bg-[#F4F7F5] dark:bg-[#182E25]">
            <canvas
              ref={canvasRef}
              width={380}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-[140px] cursor-crosshair touch-none"
            />
          </div>
        </div>

        {/* Photo Delivery Proof */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#238B5E]" />
            Package Doorstep Photo (Optional)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F7F5] hover:bg-[#E8F5EF] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition">
              <Camera className="w-3.5 h-3.5 text-[#F7A838]" />
              <span>{photoPreview ? 'Retake Photo' : 'Capture Photo'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </label>
            {photoPreview && (
              <span className="text-xs text-[#238B5E] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
              </span>
            )}
          </div>
        </div>

        {/* OTP Verification */}
        <div className="p-3 bg-[#F4F7F5] dark:bg-[#182E25] rounded-2xl border border-[#D8E2DC]/60 dark:border-[#1F3A2E] space-y-2">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#238B5E]" />
            Customer OTP Code (Optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="e.g. 5821"
              disabled={isOtpVerified}
              className="w-32 bg-white dark:bg-[#13251E] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-1.5 text-xs text-center tracking-widest font-mono font-bold"
            />
            {!isOtpVerified ? (
              <button
                type="button"
                onClick={handleVerifyOtp}
                className="px-3 py-1.5 bg-[#E8F5EF] hover:bg-[#D4ECE1] text-[#1E5B44] rounded-xl text-xs font-bold transition"
              >
                Verify OTP
              </button>
            ) : (
              <span className="text-xs text-[#238B5E] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Code Verified
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
            Delivery Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Handed to security guard at gate"
            className="w-full bg-[#F4F7F5] dark:bg-[#182E25] border border-[#D8E2DC] dark:border-[#1F3A2E] rounded-xl px-3 py-2 text-xs text-[#111C16] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#238B5E]"
          />
        </div>

        {/* Confirm Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D8E2DC] dark:border-[#1F3A2E]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#F4F7F5] hover:bg-[#E8F5EF] dark:bg-[#182E25] text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-[#F7A838] hover:bg-[#E69727] text-[#111C16] font-black rounded-xl text-xs shadow-sm flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Delivery</span>
          </button>
        </div>
      </div>
    </div>
  );
};
