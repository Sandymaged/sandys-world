import Image from "next/image";
import { Icon } from "./icons";

/** صورة المنتج، ولو لسه مفيش صورة: خلفية هادية وأيقونة هدية */
export function GiftArt({
  image,
  label,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  zoom = false,
}: {
  image?: string | null;
  label?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  zoom?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-surface ${className}`}>
      {image ? (
        <Image
          src={image}
          alt={label ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={image.startsWith("/media/")}
          className={`object-cover ${zoom ? "transition-transform duration-500 group-hover:scale-[1.04]" : ""}`}
        />
      ) : (
        <div className="grid h-full place-items-center text-muted/50" aria-hidden>
          <Icon name="gift" className="size-1/4" />
        </div>
      )}
    </div>
  );
}
