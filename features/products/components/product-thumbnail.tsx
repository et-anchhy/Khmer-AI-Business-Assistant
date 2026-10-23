import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProductThumbnail({ url, alt, className }: { url: string | null; alt: string; className?: string }) {
  return (
    <span className={cn("relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted", className)}>
      {url ? (
        // Local previews (blob: URLs) cannot go through the image optimizer.
        <Image src={url} alt={alt} fill sizes="112px" className="object-cover" unoptimized={url.startsWith("blob:")} />
      ) : (
        <Package className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}
