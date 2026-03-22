import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, ArrowRight, History, SendHorizonal } from "lucide-react";

const features = [
  {
    icon: SendHorizonal,
    title: "Transmittal Management",
    description:
      "Create, send, and track invoice transmittals in one place. Know exactly where each document is in the pipeline — no follow-up emails needed.",
  },
  {
    icon: Users,
    title: "Role-based Permissions",
    description:
      "Assign access by role so the right people see only what they need. Finance, approvers, and viewers each get a tailored experience.",
  },
  {
    icon: History,
    title: "Invoice History Lookup",
    description:
      "Pull up the full audit trail of any invoice instantly — every status change, approval, and transmittal logged with timestamps.",
  },
];

// Reusable style helper
const fadeIn = (delay: string) => ({
  animation: `fade-drop 0.6s ease-out ${delay} forwards`,
  opacity: 0,
});

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2" style={fadeIn("0ms")}>
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight text-foreground">BITS</span>
          </div>
          <div style={fadeIn("100ms")}>
            <Button size="sm">
              <Link href="/signin">
                <span className="flex items-center gap-1.5">Sign In <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.4105 0.1535 301.7182 / 0.12), transparent)",
            }}
          />

          <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
            <div style={fadeIn("100ms")}>
              <Badge variant="secondary" className="mb-6 font-mono text-xs tracking-wider">
                Billing Invoice Tracking System
              </Badge>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] mb-6" style={fadeIn("200ms")}>
              Every invoice,{" "}
              <span className="text-primary">accounted for.</span>
            </h1>

            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-10 leading-relaxed" style={fadeIn("350ms")}>
              Track, manage, and close invoices without the chaos. Built for
              teams who can&apos;t afford to lose a single bill.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3" style={fadeIn("450ms")}>
              <Button size="lg">
                <Link href="/signin">
                  <span className="flex items-center gap-2">Get Started <ArrowRight className="w-4 h-4" /></span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border" style={fadeIn("550ms")}>
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>BITS — Billing Invoice Tracking System</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

      <style>{`
        @keyframes fade-drop {
          0%   { opacity: 0; transform: translateY(-0.4em); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}