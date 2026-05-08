"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

export default function ArrivalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    const reload = () => {
        startTransition(() => {
            router.refresh();
            reset();
        });
    };

    return (
        <Card className="w-full h-[510px] border-border rounded-sm bg-card overflow-hidden shadow-sm flex flex-col">

            <CardHeader className="px-7 py-6">
                <CardTitle className="text-[19px] font-bold text-foreground">
                    Arrival Shifts
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow flex flex-col items-center justify-center p-8 text-center">

                {/* Icon */}
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>

                {/* Title */}
                <h3 className="text-[16px] font-bold text-foreground mb-2">
                    Failed to load data
                </h3>

                {/* Description */}
                <p className="text-[13px] text-muted-foreground max-w-[250px] mb-6">
                    {error?.message ||
                        "There was an issue fetching this section's data. Please try again."}
                </p>

                {/* Button */}
                <Button
                    variant="outline"
                    onClick={reload}
                    className="rounded-xl px-6 h-10 gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Try again
                </Button>

            </CardContent>
        </Card>
    );
}
