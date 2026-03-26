import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

export type ArrowLinkProps = {
  url: string;
  label?: string;
  className?: string;
};

export default function ArrowLink({
  url,
  label = "Navigate",
  className,
}: ArrowLinkProps) {
  return (
    <Link href={url}>
      <Button variant="ghost" className={className} aria-label={label}>
        <ArrowRight className="size-6" />
        {label && <span className="sr-only">{label}</span>}
      </Button>
    </Link>
  );
}
