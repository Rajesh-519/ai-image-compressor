import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl justify-center px-6 py-20 lg:px-8">
        <Card className="w-full max-w-xl">
          <CardContent className="space-y-6 p-8 text-center">
            <Badge>Authentication</Badge>
            <h1 className="font-display text-4xl font-semibold text-white">Sign in to keep working</h1>
            <p className="text-muted-foreground">Dashboard, billing, API keys, and image history.</p>
            <GoogleSignInButton />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
