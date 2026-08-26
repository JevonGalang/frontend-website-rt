import { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, Loader2, ShieldCheck, AlertCircle, CheckCircle2, X as XIcon } from 'lucide-react';

export default function OtpVerificationModal({
  isOpen,
  onClose,
  userId,
  email = '',
  title = 'Verifikasi Kode OTP',
  subtitle,
  onSuccess,
  initialTimer = 60,
  flowType = 'admin_registration' // 'admin_registration' | 'user_login'
}) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(initialTimer);
  const [otpError, setOtpError] = useState('');
  const [resendSuccess, setResendSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);
  const hasAutoSentRef = useRef(false);

  // Reset state when modal opens / closes
  useEffect(() => {
    if (isOpen) {
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimer(initialTimer);
      setOtpError('');
      setResendSuccess('');
      setIsVerifying(false);
      setIsResending(false);

      // Focus first input box
      const timer = setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset auto-send guard when modal is closed
      hasAutoSentRef.current = false;
    }
  }, [isOpen, initialTimer]);

  // Auto-send OTP on mount/open ONLY for flowType === 'user_login'
  useEffect(() => {
    if (isOpen && flowType === 'user_login' && userId && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;

      const autoSendOtp = async () => {
        setIsResending(true);
        setOtpError('');
        setResendSuccess('');

        try {
          const response = await fetch('http://172.20.32.31:3333/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: parseInt(userId) })
          });

          const resData = await response.json();

          if (!response.ok || resData.success === false) {
            const errorMsg = resData.pesan || resData.message || resData.error || 'Gagal mengirimkan kode OTP ke email.';
            setOtpError(errorMsg);
          } else {
            setResendSuccess(resData.pesan || resData.message || 'Kode OTP baru telah otomatis dikirimkan ke email Anda.');
            setOtpTimer(60);
            setOtpDigits(['', '', '', '', '', '']);
          }
        } catch (err) {
          console.warn('Auto-request OTP error:', err);
          setOtpError(`Koneksi gagal saat mengirim kode OTP: ${err.message}`);
        } finally {
          setIsResending(false);
        }
      };

      autoSendOtp();
    }
  }, [isOpen, flowType, userId]);

  // Countdown timer for resend button
  useEffect(() => {
    let timerInterval;
    if (isOpen && otpTimer > 0) {
      timerInterval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [isOpen, otpTimer]);

  if (!isOpen) return null;

  const handleInputChange = (index, value) => {
    // Only allow single numeric character
    const sanitized = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = sanitized.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');
    setResendSuccess('');

    // Automatically focus next input if filled
    if (sanitized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '');
    if (pasted.length > 0) {
      const chars = pasted.slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      chars.forEach((c, idx) => {
        newDigits[idx] = c;
      });
      setOtpDigits(newDigits);
      setOtpError('');
      setResendSuccess('');

      const targetIdx = Math.min(chars.length, 5);
      inputRefs.current[targetIdx]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || isResending || !userId) return;

    setIsResending(true);
    setOtpError('');
    setResendSuccess('');

    try {
      const response = await fetch('http://172.20.32.31:3333/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(userId) })
      });

      const resData = await response.json();

      if (!response.ok || resData.success === false) {
        const errorMsg = resData.pesan || resData.message || resData.error || 'Gagal mengirim ulang kode OTP.';
        setOtpError(errorMsg);
      } else {
        setResendSuccess(resData.pesan || resData.message || 'Kode OTP baru telah berhasil dikirimkan ke email.');
        setOtpTimer(60);
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.warn('Gagal request OTP:', err);
      setOtpError(`Koneksi gagal: ${err.message}`);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setOtpError('Harap masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (!userId) {
      setOtpError('User ID tidak valid untuk verifikasi OTP.');
      return;
    }

    setIsVerifying(true);
    setOtpError('');
    setResendSuccess('');

    try {
      const response = await fetch('http://172.20.32.31:3333/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          otp: enteredOtp
        })
      });

      const resData = await response.json();

      if (!response.ok || resData.success === false) {
        const errorMsg = resData.pesan || resData.message || resData.error || 'Kode OTP tidak valid atau sudah kedaluwarsa.';
        setOtpError(errorMsg);
        setIsVerifying(false);
        return;
      }

      // Successful verification
      setIsVerifying(false);
      if (onSuccess) {
        onSuccess(resData);
      }
    } catch (err) {
      console.warn('Gagal verify OTP:', err);
      setOtpError(`Koneksi gagal: ${err.message}`);
      setIsVerifying(false);
    }
  };

  const isComplete = otpDigits.join('').length === 6;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden z-10 animate-scale-up p-6 sm:p-7 space-y-6">
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"></div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="Tutup"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Header Info */}
        <div className="text-center space-y-3 pt-2">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30 border border-emerald-500/40 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium px-2">
            {subtitle || (email ? (flowType === 'user_login' ? 'Kode OTP baru telah otomatis dikirimkan ke email Anda. Masukkan 6 digit kode tersebut untuk mengaktifkan akun:' : 'Masukkan 6 digit kode OTP yang telah dikirimkan ke email:') : 'Masukkan 6 digit kode verifikasi OTP yang telah dikirimkan ke alamat email terdaftar:')}
          </p>
          {email ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-800 dark:text-emerald-300 font-mono font-bold text-xs">
              <span>📧</span>
              <span className="break-all">{email}</span>
            </div>
          ) : null}
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerifySubmit} className="space-y-5">
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={handlePaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                id={`otp-input-${index}`}
                name={`otp-code-${index}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit OTP ke-${index + 1}`}
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-black rounded-xl border-2 outline-none p-0 transition-all ${
                  digit 
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {otpError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{otpError}</span>
            </div>
          )}

          {/* Resend Success Message */}
          {resendSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}

          {/* Resend Timer / Button */}
          <div className="text-center pt-1">
            {otpTimer > 0 ? (
              <p className="text-xs text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                <span>Tidak menerima kode? Kirim ulang dalam</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{otpTimer}s</span>
              </p>
            ) : (
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendOtp}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-center gap-1.5 mx-auto hover:underline cursor-pointer bg-emerald-500/10 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim Ulang...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>⚡ Kirim Ulang Kode OTP</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isComplete || isVerifying || isResending}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi OTP</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
