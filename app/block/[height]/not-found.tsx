import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function BlockNotFound() {
  return (
    <div className="container py-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Block Not Found</h1>
      <p className="text-muted-foreground mb-6">The block you&apos;re looking for doesn&apos;t exist or hasn&apos;t been mined yet.</p>
      <Link href="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
}