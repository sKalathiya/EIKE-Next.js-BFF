import { AmbientBackground } from "@/components/motion/ambient-background";
import { AppHeader } from "@/components/site/app-header";
import { shellWidth } from "@/components/site/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <AmbientBackground variant="soft" />
      <AppHeader />
      <div className={`relative z-10 flex w-full flex-1 flex-col py-8 animate-fade-in ${shellWidth}`}>
        {children}
      </div>
    </div>
  );
}
