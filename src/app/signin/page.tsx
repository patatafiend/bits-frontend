import { LoginForm } from "@/components/login-form";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-5xl shadow-2xl border-0 overflow-hidden">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 min-h-[600px]">
            <div className="flex flex-col p-8 md:p-12 lg:p-16">
              <div className="mb-8">
                {/* <Image
                  src="/stock-care-logo.png"
                  alt="StockCare Logo"
                  width={56}
                  height={56}
                  className="dark:brightness-90"
                  priority
                /> */}
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="w-full max-w-sm">
                  <LoginForm />
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent z-10" />
              {/* <Image
                src="/ws.png"
                alt="Warehouse"
                fill
                className="object-cover opacity-80"
                priority
              /> */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
