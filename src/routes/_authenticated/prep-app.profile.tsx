import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { ProfileForm } from "./onboarding";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Planted & Simple" }, { name: "description", content: "Your preferences." }, { property: "og:title", content: "Profile — Planted & Simple" }, { property: "og:description", content: "Your preferences." }] }),
  component: () => (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Your preferences" title="Profile" />
      <ProfileForm submitLabel="Save changes" />
    </div>
  ),
});
