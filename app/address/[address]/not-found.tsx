import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AddressNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Address Not Found</h1>
      <p className="text-muted-foreground mb-6">The address you&apos;re looking for doesn&apos;t exist or hasn&apos;t been indexed yet.</p>
      <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2">
        Return to Home
      </Link>
    </div>
  );
}