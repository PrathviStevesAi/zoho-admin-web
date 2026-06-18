import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import NotificationProvider from "@/components/NotificationProvider";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user?.role !== "admin" && session?.user?.role !== "member") {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold mb-3 text-slate-800">Access Denied</h1>
        <p className="text-slate-600 mb-8 max-w-md">
          You do not have permission to view the Admin Dashboard. This portal is restricted to admin only.
        </p>
        <form action={logoutAction}>
          <Button className="cursor-pointer" type="submit" variant="destructive" size="lg">
            Logout
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <NotificationProvider />
      <Sidebar userRole={session?.user?.role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
