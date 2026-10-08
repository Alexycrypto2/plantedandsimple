import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades content up as it enters the viewport. Respects reduced motion. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
}: {
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <div
      className={`mb-12 grid gap-4 ${
        centered ? "text-center" : "grid-cols-[minmax(0,1fr)_auto] items-end text-left"
      }`}
    >
      <div className={centered ? "" : "min-w-0"}>
        {eyebrow ? (
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-sage">{eyebrow}</p>
        ) : null}
        <h2 className="mt-3 font-display text-4xl italic leading-[1.05] text-forest-deep md:text-5xl">{title}</h2>
        {subtitle ? (
          <p className={`mt-4 text-base leading-relaxed text-charcoal/65 ${centered ? "mx-auto max-w-2xl" : "max-w-xl"}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MediaImage({
  src,
  alt,
  className = "",
  ratio = "aspect-[4/3]",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  ratio?: string;
  priority?: boolean;
}) {
  return (
    <div className={`${ratio} overflow-hidden bg-cream-warm ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid h-full w-full place-items-center font-display text-2xl italic text-sage/50">
          Planted&amp;Simple
        </div>
      )}
    </div>
  );
}

export function EditorialCard({
  to,
  params,
  image,
  alt,
  eyebrow,
  title,
  meta,
  ratio,
}: {
  to: string;
  params?: Record<string, string>;
  image?: string | null;
  alt: string;
  eyebrow?: string | null;
  title: string;
  meta?: string | null;
  ratio?: string;
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-[var(--shadow-soft)] transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-card)] sm:rounded-[1.75rem]"
    >
      <MediaImage src={image} alt={alt} ratio={ratio ?? "aspect-square sm:aspect-[4/3]"} />
      <div className="flex flex-1 flex-col p-3 sm:p-5 md:p-6">
        {eyebrow ? (
          <p className="truncate font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-sage sm:text-[10px] sm:tracking-[0.24em]">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="mt-1 line-clamp-2 font-display text-base italic leading-snug text-forest-deep sm:mt-2 sm:text-xl md:text-2xl">
          {title}
        </h3>
        {meta ? (
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-charcoal/55 sm:mt-2 sm:text-sm">{meta}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-forest/15 bg-cream-warm px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-forest">
      {children}
    </span>
  );
}