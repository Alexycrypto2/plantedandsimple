import { Link } from "@tanstack/react-router";
import { MediaImage, Pill } from "@/components/site/primitives";
import type { Hub, LinkCard, PageLinks } from "@/lib/linking/linking.functions";
import { hubAnchor } from "@/lib/linking/related";

function CardLink({ c }: { c: LinkCard }) {
  return c.type === "recipe"
    ? <Link to="/recipes/$slug" params={{ slug: c.slug }} className="group block">{children(c)}</Link>
    : <Link to="/blog/$slug" params={{ slug: c.slug }} className="group block">{children(c)}</Link>;
}
function children(c: LinkCard) {
  return (
    <>
      <MediaImage src={c.image} alt={c.title} className="rounded-2xl" />
      <h3 className="mt-3 line-clamp-2 font-display text-lg italic leading-snug text-forest-deep">{c.title}</h3>
      {c.type === "recipe" ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {c.prep_minutes ? <Pill>{c.prep_minutes} min prep</Pill> : null}
          {c.difficulty ? <Pill>{c.difficulty}</Pill> : null}
        </div>
      ) : null}
    </>
  );
}

function TextLink({ c }: { c: LinkCard }) {
  const cls = "text-forest underline underline-offset-4 hover:text-forest-deep";
  return c.type === "recipe"
    ? <Link to="/recipes/$slug" params={{ slug: c.slug }} className={cls}>{c.title}</Link>
    : <Link to="/blog/$slug" params={{ slug: c.slug }} className={cls}>{c.title}</Link>;
}

function Joined({ items }: { items: LinkCard[] }) {
  return <>{items.map((c, i) => <span key={c.href}>{i ? " · " : ""}<TextLink c={c} /></span>)}</>;
}

export function RelatedSection({ links, heading, readLabel }: { links: PageLinks; heading: string; readLabel: string }) {
  if (!links.recipes.length && !links.blogs.length) return null;
  return (
    <section className="mt-16" aria-label={heading}>
      <h2 className="font-display text-3xl italic text-forest-deep">{heading}</h2>
      {links.recipes.length ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {links.recipes.map((c) => <CardLink key={c.href} c={c} />)}
        </div>
      ) : null}
      {links.blogs.length ? (
        <p className="mt-6 text-sm leading-relaxed text-charcoal/75">
          <span className="font-semibold text-forest-deep">{readLabel}</span> <Joined items={links.blogs} />
        </p>
      ) : null}
      {links.hubs.map((h) => (
        <p key={h.name} className="mt-3 text-sm leading-relaxed text-charcoal/75">
          See all our{" "}
          <Link to="/recipes" hash={h.anchor} className="text-forest underline underline-offset-4">{h.name.toLowerCase()} recipes</Link>
          {h.menu ? <>{" "}or plan the day with <TextLink c={h.menu} /></> : null}.
        </p>
      ))}
    </section>
  );
}

export function RoundupList({ roundup }: { roundup: PageLinks["roundup"] }) {
  if (!roundup || !roundup.items.length) return null;
  return (
    <section className="mt-12 rounded-[2rem] bg-cream-warm p-6 md:p-8" aria-label={`All ${roundup.tag} recipes`}>
      <h2 className="font-display text-2xl italic text-forest-deep">Every {roundup.tag.toLowerCase()} recipe on the site</h2>
      <ul className="mt-4 space-y-2 text-sm">
        {roundup.items.map((c) => <li key={c.href}><TextLink c={c} /></li>)}
      </ul>
    </section>
  );
}

export function HubSections({ hubs }: { hubs: Hub[] }) {
  if (!hubs.length) return null;
  return (
    <>
      {hubs.map((h) => (
        <section key={h.name} id={hubAnchor(h.name)} className="mt-20 scroll-mt-24">
          <h2 className="font-display text-3xl italic text-forest-deep">{h.name} Recipes</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {h.items.map((c) => <CardLink key={c.href} c={c} />)}
          </div>
        </section>
      ))}
    </>
  );
}
