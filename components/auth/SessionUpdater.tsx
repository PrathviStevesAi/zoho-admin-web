"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function SessionUpdater({ currentRole }: { currentRole: string }) {
  const { data: session, update } = useSession();

  useEffect(() => {
    if (session?.user && session.user.role !== currentRole) {
      update({ role: currentRole });
    }
  }, [session, currentRole, update]);

  return null;
}
