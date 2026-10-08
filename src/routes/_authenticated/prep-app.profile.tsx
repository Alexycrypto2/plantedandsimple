import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/prep-kit/components/AppShell";
import { ProfileForm } from "./prep-app.onboarding";

export const Route = createFileRoute("/_authenticated/prep-app/profile")({
  head: () => ({ meta: [{ title: "Profile — Planted & Simple" }, { name: "description", content: "Your preferences." }, { property: "og:title", content: "Profile — Planted & Simple" }, { property: "og:description", content: "Your preferences." }] }),
  component: () => (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Your preferences" title="Profile" />
      <ProfileForm submitLabel="Save changes" />
    </div>
  ),
});
