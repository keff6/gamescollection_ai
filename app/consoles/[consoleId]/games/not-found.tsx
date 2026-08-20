import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ConsoleNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Console not found</h1>
      <p className="text-sm text-muted-foreground">
        This console doesn&apos;t exist or may have been removed.
      </p>
      <Button asChild>
        <Link href="/brands">Back to Brands</Link>
      </Button>
    </div>
  );
}
