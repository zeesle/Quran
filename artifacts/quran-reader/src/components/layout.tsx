import { Link } from "wouter";
import { ThemeToggle } from "./theme-provider";
import { SettingsPanel } from "./settings-panel";
import { PushFailureBanner } from "./push-failure-banner";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-300">
      <PushFailureBanner />
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary font-arabic">القرآن</span>
            <span className="text-lg font-semibold hidden sm:inline-block tracking-wide">The Noble Quran</span>
          </Link>
          <div className="flex items-center gap-2">
            <SettingsPanel />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4 md:h-16 px-4">
          <p className="text-sm text-muted-foreground">
            Data provided by <a href="https://alquran.cloud" target="_blank" rel="noreferrer" className="underline hover:text-primary transition-colors">AlQuran.cloud</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
