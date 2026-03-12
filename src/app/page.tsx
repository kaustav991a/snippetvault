import SnippetVault from "@/components/SnippetVault";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="min-h-screen">
      <SnippetVault />
      <Toaster />
    </main>
  );
}
