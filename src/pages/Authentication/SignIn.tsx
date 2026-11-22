import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import IconDark from '../../images/logo/icon-dark.png';
import IconLight from '../../images/logo/icon-light.png';
import Spinner from '../../ui/Spinner';
import { useAuth, detectPortalTenant } from '../../Context/Auth';
import { getBrandConfig } from '../../utils/brand';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';
import { MdLockOutline, MdTimer, MdSecurity } from 'react-icons/md';
import { checkLoginSecurityStatus, formatLockoutTime, SecurityStatus } from '../../utils/loginSecurity';

import { Navigate, useNavigate } from 'react-router-dom';

const SignIn: React.FC = () => {
  const brand = getBrandConfig();
  const { login, currentUser, tenantId } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Security Lockout & Rate-Limiting State
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>(() => checkLoginSecurityStatus());

  // Check active tenant slug if coming from a tenant link (e.g. /bashir/signin)
  const activeTenantSlug = detectPortalTenant();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const currentTenant = String(tenantId || 'uzair').toLowerCase().trim();

  // If user is already authenticated, redirect immediately to dashboard
  if (currentUser?.id || isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

// Formik validation schema for login
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // Guard against submitting while under active security lockout
      const currentSec = checkLoginSecurityStatus(values.email);
      if (currentSec.isLocked) {
        setSecurityStatus(currentSec);
        setAuthError(`Security lockout active (Level ${currentSec.tier}). Please wait ${formatLockoutTime(currentSec.remainingSeconds)}.`);
        return;
      }

      try {
        setLoading(true);
        setAuthError(null);
        await login(values.email, values.password);
        navigate('/dashboard', { replace: true });
      } catch (error: any) {
        setAuthError(error.message || 'An error occurred during sign in');
        const updatedSec = checkLoginSecurityStatus(values.email);
        setSecurityStatus(updatedSec);
      } finally {
        setLoading(false);
      }
    },
  });

  // Live 1-second ticker to check real-time lockout expiry and update countdown
  useEffect(() => {
    const updateStatus = () => {
      const status = checkLoginSecurityStatus(formik.values.email);
      setSecurityStatus(status);
      if (!status.isLocked && authError && authError.includes('Security lockout triggered')) {
        setAuthError(null);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [formik.values.email, authError]);

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#070A10] min-h-screen flex flex-col font-sans selection:bg-emerald-600 selection:text-white relative overflow-hidden">
      {/* Ambient background light meshes */}
      <div className="pointer-events-none absolute top-[-10%] left-[20%] w-[500px] h-[400px] bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[15%] w-[450px] h-[350px] bg-teal-500/10 dark:bg-teal-600/10 rounded-full blur-[120px]" />

      {/* Header Bar */}
      <header className="w-full backdrop-blur-md bg-white/90 dark:bg-[#0B0F17]/90 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3.5 md:px-6 2xl:px-11 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#0B0F17] p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-md flex items-center justify-center shrink-0">
              <img src={IconDark} alt="Logo" className="w-full h-full object-contain hidden dark:block" />
              <img src={IconLight} alt="Logo" className="w-full h-full object-contain block dark:hidden" />
            </div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="text-[19px] font-black text-emerald-600 dark:text-emerald-400">{brand.brandWord1} {brand.brandWord2}</span>
              <span className="text-[19px] font-black text-slate-800 dark:text-slate-100">{brand.brandSuffix}</span>
            </div>
          </div>
          <ul className="flex items-center gap-2 m-0 list-none">
            <DarkModeSwitcher />
          </ul>
        </div>
      </header>

      {/* Main Content: Direct Sign In Form */}
      <div className="flex flex-1 justify-center items-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md bg-white dark:bg-[#0F1622] rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 backdrop-blur-md">
          
          <div className="text-center mb-7">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-2.5 border border-slate-200/80 dark:border-slate-700/60 shadow-md flex items-center justify-center">
                <img src={IconDark} alt="Logo" className="w-full h-full object-contain hidden dark:block" />
                <img src={IconLight} alt="Logo" className="w-full h-full object-contain block dark:hidden" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Enterprise Employee Business Management System
            </p>
          </div>

          {/* Display Security Lockout Active Card */}
          {securityStatus.isLocked ? (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
                <MdLockOutline size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                <span>Security Cooldown Active (Level {securityStatus.tier})</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                5 consecutive failed attempts detected. Access is temporarily paused for security.
              </p>
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-rose-200 dark:border-rose-900/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <MdTimer size={14} /> Time Remaining:
                </span>
                <span className="font-mono font-black text-sm text-rose-800 dark:text-rose-200 tracking-wider bg-white dark:bg-rose-900/50 px-3 py-1 rounded-lg border border-rose-300 dark:border-rose-700 shadow-2xs">
                  {formatLockoutTime(securityStatus.remainingSeconds)}
                </span>
              </div>
            </div>
          ) : authError ? (
            /* Display Auth Errors */
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center leading-relaxed">
              {authError}
            </div>
          ) : null}

          {/* Inactivity & Failed Attempt Warning Pill */}
          {!securityStatus.isLocked && securityStatus.currentAttempts > 0 && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
              <span className="font-medium">
                Failed attempts: <strong className="font-bold">{securityStatus.currentAttempts} of 5</strong>
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                10m inactivity resets attempts to 0
              </span>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={securityStatus.isLocked || loading}
                placeholder="e.g. admin@company.com"
                className={`w-full rounded-xl border py-3 px-4 text-xs outline-none transition duration-150 ${
                  securityStatus.isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50/50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                } ${
                  formik.touched.email && formik.errors.email ? 'border-rose-500' : 'border-slate-200'
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{formik.errors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-slate-200">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={securityStatus.isLocked || loading}
                placeholder="Enter password"
                className={`w-full rounded-xl border py-3 px-4 text-xs outline-none transition duration-150 ${
                  securityStatus.isLocked
                    ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
                    : 'bg-slate-50/50 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700'
                } ${
                  formik.touched.password && formik.errors.password ? 'border-rose-500' : 'border-slate-200'
                }`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-rose-500 text-xs mt-1 font-medium">{formik.errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || securityStatus.isLocked}
              className={`w-full rounded-xl p-3.5 text-xs font-extrabold text-white transition-all duration-200 shadow-md mt-3 flex items-center justify-center gap-2 ${
                securityStatus.isLocked
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-90'
                  : loading
                  ? 'opacity-75 cursor-not-allowed bg-emerald-600'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 hover:-translate-y-0.5 cursor-pointer'
              }`}
            >
              {securityStatus.isLocked ? (
                <>
                  <MdLockOutline size={16} />
                  <span>Locked ({formatLockoutTime(securityStatus.remainingSeconds)})</span>
                </>
              ) : loading ? (
                <Spinner />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
            Encrypted End-to-End Enterprise Session
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
