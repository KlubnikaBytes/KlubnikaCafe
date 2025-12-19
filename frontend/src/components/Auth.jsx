import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from './Loader';

const formVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};
const inputVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

const Auth = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginMethod, setLoginMethod] = useState('password'); 
  const [step, setStep] = useState('credentials'); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    verifyMethod: 'email',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const { login, sendSignupOtp, verifySignup, sendLoginOtp, loginWithOtp } = useAuth();
  const { mergeAndFetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // 🚀 REDIRECT LOGIC: If they came from another page (like Dishes), go back there.
  // Otherwise, go to home ('/').
  const from = location.state?.from?.pathname || "/";
  
  useEffect(() => {
    let interval;
    if ((step === 'otp' || step === 'loginOtp') && timer > 0) {
      setCanResend(false);
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  useEffect(() => {
    if (step === 'otp' || step === 'loginOtp') {
      setTimer(30);
      setCanResend(false);
    }
  }, [step]);

  const handleToggleMode = () => {
    setIsLoginMode((prev) => !prev);
    setFormData({ name: '', email: '', password: '', mobile: '', verifyMethod: 'email' });
    setError(null);
    setMessage(null);
    setStep('credentials');
    setLoginMethod('password');
    setOtp('');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setError(null); setMessage(null); setLoading(true);
    try {
      if (isLoginMode && step === 'loginOtp') {
        const data = await sendLoginOtp(formData.mobile);
        setMessage(data.message || 'OTP Resent!');
      } else if (!isLoginMode && step === 'otp') {
        const data = await sendSignupOtp(formData);
        setMessage(data.message || 'OTP Resent!');
      }
      setTimer(30);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- SUBMIT FUNCTIONS ---

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const data = await sendSignupOtp(formData);
      setMessage(data.message);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupOtpSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    
    try {
      await verifySignup({ 
        email: formData.email, 
        mobile: formData.mobile,
        otp 
      });

      const loginData = await login({ 
        email: formData.email, 
        password: formData.password 
      });

      await mergeAndFetchCart(loginData.token);
      setMessage('Signup successful! Redirecting...');
      
      // 🚀 REDIRECT BACK
      navigate(from, { replace: true });
      
    } catch (err) {
      setError(err.message || 'Verification or Auto-login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const data = await login({ email: formData.email, password: formData.password });
      await mergeAndFetchCart(data.token); 
      
      // 🚀 REDIRECT BACK
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const data = await sendLoginOtp(formData.mobile);
      setMessage(data.message);
      setStep('loginOtp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();
    setError(null); setMessage(null); setLoading(true);
    try {
      const data = await loginWithOtp(formData.mobile, otp);
      await mergeAndFetchCart(data.token);
      
      // 🚀 REDIRECT BACK
      navigate(from, { replace: true });

    } catch (err) {
      setError(err.message || 'Invalid OTP or Login Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <motion.div
        className="container mx-auto min-h-screen flex items-center justify-center px-4"
        initial="hidden" animate="visible" variants={formVariants}
      >
        <div className="w-full max-w-md p-8 bg-neutral-800/50 backdrop-blur-lg rounded-2xl shadow-xl flex flex-col items-center">
          
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white text-center mb-8 w-full">
            {isLoginMode ? 'Welcome Back' : step === 'credentials' ? 'Create Account' : 'Verify Account'}
          </h2>
          
          {error && <motion.p className="text-center text-red-400 mb-4 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
          {message && <motion.p className="text-center text-green-400 mb-4 w-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{message}</motion.p>}

          {/* ================= LOGIN MODE ================= */}
          {isLoginMode && (
            <div className="w-full flex flex-col items-center">
              
              {/* Toggle Login Method */}
              {step !== 'loginOtp' && (
                <div className="flex gap-6 mb-6 border-b border-neutral-600 pb-2 w-full justify-center">
                  <button 
                    onClick={() => { setLoginMethod('password'); setStep('credentials'); setError(null); }} 
                    className={`text-sm pb-1 ${loginMethod === 'password' ? 'text-primary font-bold border-b-2 border-primary' : 'text-neutral-400'}`}
                  >
                    Password
                  </button>
                  <button 
                    onClick={() => { setLoginMethod('otp'); setStep('credentials'); setError(null); }} 
                    className={`text-sm pb-1 ${loginMethod === 'otp' ? 'text-primary font-bold border-b-2 border-primary' : 'text-neutral-400'}`}
                  >
                    OTP (Mobile)
                  </button>
                </div>
              )}

              {/* A. Password Login Form */}
              {loginMethod === 'password' && step === 'credentials' && (
                <form onSubmit={handleLoginSubmit} className="space-y-6 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="you@example.com" />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" placeholder="••••••••" />
                  </div>
                  <button type="submit" disabled={loading} className="button-primary w-full text-center hover:bg-primary-700 active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">Login</button>
                </form>
              )}

              {/* B. Mobile OTP Login (Step 1: Send) */}
              {loginMethod === 'otp' && step === 'credentials' && (
                <form onSubmit={handleSendLoginOtp} className="space-y-6 w-full flex flex-col items-center">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Mobile Number</label>
                    <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="input-field" placeholder="e.g. 9876543210" />
                  </div>
                  <button type="submit" disabled={loading} className="button-primary w-full text-center hover:bg-primary-700 active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">Send OTP</button>
                </form>
              )}

              {/* C. Mobile OTP Login (Step 2: Verify) */}
              {loginMethod === 'otp' && step === 'loginOtp' && (
                <form onSubmit={handleVerifyLoginOtp} className="space-y-6 w-full flex flex-col items-center">
                   <div className="w-full">
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Enter OTP sent to {formData.mobile}</label>
                    <input type="text" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required className="input-field" placeholder="6-digit OTP" />
                    
                    <div className="mt-2 text-right">
                      <button 
                        type="button" 
                        onClick={handleResendOtp} 
                        disabled={!canResend}
                        className={`text-xs ${canResend ? 'text-primary hover:underline cursor-pointer' : 'text-neutral-500 cursor-not-allowed'}`}
                      >
                        {canResend ? "Resend OTP" : `Resend OTP in ${timer}s`}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="button-primary w-full text-center hover:bg-primary-700 active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">Verify & Login</button>
                  <button type="button" onClick={() => setStep('credentials')} className="text-neutral-400 hover:text-white text-sm underline cursor-pointer">Back</button>
                </form>
              )}
            </div>
          )}

          {/* ================= SIGNUP MODE ================= */}
          {!isLoginMode && step === 'credentials' && (
            <form onSubmit={handleSignupSubmit} className="space-y-6 w-full flex flex-col items-center">
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" placeholder="Your Name" />
              </motion.div>
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="you@example.com" />
              </motion.div>
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Mobile Number</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className="input-field" placeholder="e.g. 9876543210" />
              </motion.div>
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-field" placeholder="••••••••" />
              </motion.div>
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Verification Method</label>
                <div className="flex gap-6">
                  <label className="flex items-center text-neutral-200 cursor-pointer">
                    <input type="radio" name="verifyMethod" value="email" checked={formData.verifyMethod === 'email'} onChange={handleChange} className="mr-2" />Email
                  </label>
                  <label className="flex items-center text-neutral-200 cursor-pointer">
                    <input type="radio" name="verifyMethod" value="mobile" checked={formData.verifyMethod === 'mobile'} onChange={handleChange} className="mr-2" />Mobile (SMS)
                  </label>
                </div>
              </motion.div>
              <button type="submit" disabled={loading} className="button-primary w-full text-center hover:bg-primary-700 active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">Get OTP</button>
            </form>
          )}

          {/* --- SIGNUP OTP VERIFICATION --- */}
          {!isLoginMode && step === 'otp' && (
            <form onSubmit={handleSignupOtpSubmit} className="space-y-6 w-full flex flex-col items-center">
              <motion.div variants={inputVariants} initial="hidden" animate="visible" className="w-full">
                <label className="block text-sm font-medium text-neutral-300 mb-1">OTP</label>
                <input type="text" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required className="input-field" placeholder="Enter 6-digit OTP" />
                
                <div className="mt-2 text-right">
                  <button 
                    type="button" 
                    onClick={handleResendOtp} 
                    disabled={!canResend}
                    className={`text-xs ${canResend ? 'text-primary hover:underline cursor-pointer' : 'text-neutral-500 cursor-not-allowed'}`}
                  >
                    {canResend ? "Resend OTP" : `Resend OTP in ${timer}s`}
                  </button>
                </div>
              </motion.div>
              <button type="submit" disabled={loading} className="button-primary w-full text-center hover:bg-primary-700 active:scale-95 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">Verify and Sign Up</button>
              <button type="button" onClick={() => setStep('credentials')} className="w-full text-center text-primary hover:underline mt-2 focus:outline-none cursor-pointer">Back</button>
            </form>
          )}

          <p className="mt-8 text-center text-neutral-400">
            {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={handleToggleMode} className="ml-2 font-medium text-primary hover:underline focus:outline-none cursor-pointer">
              {isLoginMode ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </motion.div>
    </>
  );
};

export default Auth;