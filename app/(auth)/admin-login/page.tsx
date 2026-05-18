"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction, sendOtpAction, verifyOtpAction, resetPasswordAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [view, setView] = useState<'login' | 'forgot-password'>('login');
    const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

    // Auth State
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState<string>("admin@gmail.com");
    const [password, setPassword] = useState<string>("Admin@123");

    // Forgot Password State
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0 && forgotStep === 2) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer, forgotStep]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const router = useRouter();

    const handleSendOtp = async () => {
        if (!forgotEmail) return toast.error("Please enter your email");

        startTransition(async () => {
            const res = await sendOtpAction(forgotEmail);
            if (res.success) {
                toast.success(res.message);
                setForgotStep(2);
                setTimer(300); // 5 minutes
                setCanResend(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleVerifyOtp = async () => {
        if (!otp) return toast.error("Please enter the OTP");

        startTransition(async () => {
            const res = await verifyOtpAction(forgotEmail, otp);
            if (res.success) {
                toast.success("OTP Verified Successfully");
                setResetToken(res.accessToken || "");
                setRefreshToken(res.refreshToken || "");
                setForgotStep(3);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) return toast.error("Please fill in both password fields");
        if (newPassword !== confirmPassword) return toast.error("Passwords do not match");

        startTransition(async () => {
            const res = await resetPasswordAction(newPassword, resetToken, refreshToken);
            if (res.success) {
                toast.success(res.message);
                setView('login');
                setForgotStep(1);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        startTransition(async () => {
            const result = await loginAction({ email, password });
            if (result.success) {
                toast.success("Login Successful");
                window.location.href = "/dashboard";
            } else {
                toast.error(result.error || "Invalid Credentials");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-card shadow-xl rounded-2xl overflow-hidden border border-border min-h-[500px]">

                {/* LEFT: IMAGE SECTION */}
                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-muted/30 border-r border-border/50">
                    <div className="relative w-full aspect-square max-w-[350px] animate-in fade-in zoom-in duration-700">
                        <Image
                            src="/images/website-logo.png"
                            alt="Login Illustration"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                {/* RIGHT: FORM SECTION */}
                <div className="flex items-center justify-center p-6 sm:p-12 bg-white">
                    <div className="w-full max-w-[400px]">
                        {view === 'login' ? (
                            <div className="animate-in slide-in-from-right duration-500">
                                <Card className="w-full border-none shadow-none">
                                    <CardHeader className="space-y-2 text-center pb-6">
                                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                                            Welcome Back 👋
                                        </CardTitle>
                                        <CardDescription className="text-slate-800 font-medium">
                                            Enter your credentials to access your dashboard
                                        </CardDescription>
                                    </CardHeader>

                                    <form onSubmit={handleSubmit}>
                                        <CardContent className="space-y-6 pt-0">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-slate-700 font-bold ml-1">Email Address</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Enter your email"
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    disabled={isPending}
                                                    className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-slate-700 font-bold ml-1">Password</Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        required
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        disabled={isPending}
                                                        className="h-12 pr-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-600 transition-colors"
                                                        disabled={isPending}
                                                    >
                                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>

                                        <CardFooter className="flex flex-col gap-5 mt-4">
                                            <Button
                                                className="w-full h-12 bg-[#0064cb] hover:bg-[#0052ae] text-white text-base font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] cursor-pointer"
                                                type="submit"
                                                disabled={isPending}
                                            >
                                                {isPending ? (
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span>Sign In...</span>
                                                    </div>
                                                ) : "Sign In"}
                                            </Button>

                                            <button
                                                type="button"
                                                onClick={() => setView('forgot-password')}
                                                className="text-sm text-center text-[#0064cb] font-bold hover:underline underline-offset-4 cursor-pointer"
                                            >
                                                Forgot Password?
                                            </button>
                                        </CardFooter>
                                    </form>
                                </Card>
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-left duration-500">
                                <button
                                    onClick={() => {
                                        setView('login');
                                        setForgotStep(1);
                                        setForgotEmail("");
                                        setOtp("");
                                        setResetToken("");
                                        setRefreshToken("");
                                        setNewPassword("");
                                        setConfirmPassword("");
                                        setTimer(0);
                                        setCanResend(false);
                                    }}
                                    className="cursor-pointer flex items-center gap-2 text-slate-700 hover:text-[#0064cb] font-bold text-sm mb-6 transition-colors group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to Login
                                </button>

                                <Card className="w-full border-none shadow-none">
                                    <CardHeader className="space-y-2 text-center pb-6">
                                        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                                            {forgotStep === 1 ? "Reset Password" : forgotStep === 2 ? "Verify OTP" : "Set New Password"}
                                        </CardTitle>
                                        <CardDescription className="text-slate-800 font-medium">
                                            {forgotStep === 1
                                                ? "Enter your email to receive a recovery code"
                                                : forgotStep === 2
                                                    ? `We've sent a code to ${forgotEmail}`
                                                    : "Almost done! Choose a strong password"}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="space-y-6 pt-0">
                                        {/* STEP 1: EMAIL */}
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-bold ml-1">Email Address</Label>
                                            <Input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={forgotEmail}
                                                onChange={(e) => setForgotEmail(e.target.value)}
                                                disabled={isPending || forgotStep > 1}
                                                className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all"
                                            />
                                        </div>

                                        {/* STEP 2: OTP (Inline) */}
                                        {forgotStep >= 2 && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top duration-500">
                                                <div className="flex items-center justify-between ml-1">
                                                    <Label className="text-slate-700 font-bold">Verification Code</Label>
                                                    {timer > 0 && forgotStep === 2 && (
                                                        <span className="text-xs font-bold text-[#0064cb] bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                            Expires in {formatTime(timer)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-3">
                                                    <Input
                                                        placeholder="Enter your OTP"
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        disabled={isPending || forgotStep > 2 || (timer === 0 && !canResend)}
                                                        className={cn(
                                                            "h-12 flex-1 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all text-center text-md",
                                                            otp && "tracking-[0.5em] font-bold"
                                                        )}
                                                    />
                                                    {forgotStep === 2 && (
                                                        <Button
                                                            onClick={handleVerifyOtp}
                                                            disabled={isPending || timer === 0}
                                                            className="cursor-pointer h-12 px-6 bg-[#0064cb] hover:bg-[#0052ae] text-white font-bold rounded-xl shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none transition-all"
                                                        >
                                                            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify"}
                                                        </Button>
                                                    )}
                                                    {forgotStep > 2 && (
                                                        <div className="h-12 px-4 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-xl">
                                                            <CheckCircle2 className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                {canResend && (
                                                    <div className="text-center pt-2">
                                                        <button
                                                            onClick={handleSendOtp}
                                                            disabled={isPending}
                                                            className="text-sm font-bold text-[#0064cb] hover:underline cursor-pointer"
                                                        >
                                                            Didn't receive code? Resend OTP
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* STEP 3: RESET PASSWORDS */}
                                        {forgotStep === 3 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top duration-500">
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700 font-bold ml-1">New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type={showNewPassword ? "text" : "password"}
                                                            placeholder="Enter new password"
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            disabled={isPending}
                                                            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-600 transition-colors"
                                                            disabled={isPending}
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-slate-700 font-bold ml-1">Confirm New Password</Label>
                                                    <div className="relative">
                                                        <Input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            placeholder="Enter confirm password"
                                                            value={confirmPassword}
                                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                                            disabled={isPending}
                                                            className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-[#0064cb]/10 focus:border-[#0064cb] transition-all pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-600 transition-colors"
                                                            disabled={isPending}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>

                                    {(forgotStep === 1 || forgotStep === 3) && (
                                        <CardFooter className="flex flex-col gap-4 mt-4">
                                            {forgotStep === 1 && (
                                                <Button
                                                    onClick={handleSendOtp}
                                                    disabled={isPending}
                                                    className="cursor-pointer w-full h-12 bg-[#0064cb] hover:bg-[#0052ae] text-white text-base font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                                                >
                                                    {isPending ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            <span>Sending...</span>
                                                        </div>
                                                    ) : "Send OTP"}
                                                </Button>
                                            )}

                                            {forgotStep === 3 && (
                                                <Button
                                                    onClick={handleResetPassword}
                                                    disabled={isPending}
                                                    className="cursor-pointer w-full h-12 bg-[#0064cb] hover:bg-[#0052ae] text-white text-base font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
                                                >
                                                    {isPending ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                            <span>Resetting...</span>
                                                        </div>
                                                    ) : "Reset Password"}
                                                </Button>
                                            )}
                                        </CardFooter>
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
