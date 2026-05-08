"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction, forgotPasswordAction } from "@/actions/auth.actions";
import { toast } from "sonner";
import Swal from "sweetalert2";

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
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState<string>("admin@gmail.com");
    const [password, setPassword] = useState<string>("Admin@123");
    const router = useRouter();

    const handleForgotPassword = () => {
        Swal.fire({
            title: "Password Recovery",
            width: '600px',
            html: `
                <div class="pt-0">
                    <p class="text-slate-500 text-[14px] leading-relaxed">
                        Enter your registered email address below to receive a secure reset link.
                    </p>
                </div>
            `,
            input: "email",
            inputPlaceholder: "your@email.com",
            showCancelButton: true,
            confirmButtonText: "Send Link",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            customClass: {
                popup: 'rounded-2xl border-none shadow-2xl pt-4 px-8 pb-8',
                title: 'text-2xl font-bold text-[#000000]',
                input: 'w-full h-12 px-4 mx-0 rounded-xl border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 transition-all text-[15px] mt-2 mb-0',
                confirmButton: 'bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 ml-3 cursor-pointer',
                cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 px-8 rounded-xl transition-all active:scale-95 cursor-pointer',
                actions: 'flex items-center justify-center gap-3 pt-6 w-full',
                validationMessage: 'bg-transparent text-rose-600 p-0 m-0 text-[14px] font-medium mt-1 border-none shadow-none text-left w-full flex items-start'
            },
            buttonsStyling: false,
            inputValidator: (value) => {
                if (!value) {
                    return "Please Enter Email";
                }
            },
            showLoaderOnConfirm: true,
            preConfirm: async (email) => {
                const result = await forgotPasswordAction(email);
                if (!result.success) {
                    Swal.showValidationMessage(result.error || "Failed to process request");
                    return false;
                }
                return result;
            },
            allowOutsideClick: () => !Swal.isLoading(),
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Check Your Email",
                    text: result.value.message,
                    icon: "success",
                    confirmButtonText: "Got it",
                    confirmButtonColor: "#0064cb",
                    customClass: {
                        popup: 'rounded-2xl border-none shadow-2xl pt-4 px-8 pb-8',
                        title: 'text-2xl font-bold text-[#000000]',
                        confirmButton: 'bg-[#0064cb] hover:bg-[#0052ae] text-white font-semibold py-3 px-8 rounded-xl transition-all cursor-pointer'
                    },
                    buttonsStyling: false
                });
            }
        });
    };

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        startTransition(async () => {
            const result = await loginAction({ email, password });
            if (result.success) {
                toast.success("Login Successful");
                router.refresh();
                router.push("/dashboard");
            } else {
                toast.error(result.error || "Invalid Credentials");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-card shadow-xl rounded-2xl overflow-hidden border border-border">

                {/* LEFT: IMAGE SECTION */}
                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-muted/30">
                    <div className="relative w-full aspect-square max-w-[350px]">
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
                <div className="flex items-center justify-center p-6 sm:p-12">
                    <Card className="w-full border-none shadow-none">

                        {/* Centered Header for both Mobile & Desktop */}
                        <CardHeader className="space-y-2 text-center">
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                Welcome Back 👋
                            </CardTitle>
                            <CardDescription>
                                Enter your credentials to access your dashboard
                            </CardDescription>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@company.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isPending}
                                        className="h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isPending}
                                            className="h-11 pr-10" // Extra padding for the icon
                                        />
                                        {/* Password Toggle Button */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            disabled={isPending}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-4 mt-2">
                                <Button
                                    className="w-full h-11 text-base font-medium transition-all active:scale-[0.98] cursor-pointer"
                                    type="submit"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        "Sign In"
                                    )}
                                </Button>

                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm text-center text-primary font-medium hover:underline underline-offset-4 cursor-pointer"
                                >
                                    Forgot Password?
                                </button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
