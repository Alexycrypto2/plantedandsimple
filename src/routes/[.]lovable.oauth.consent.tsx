import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/.lovable/oauth/consent')({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({ authorization_id: typeof search['authorization_id'] === 'string' ? search['authorization_id'] : '' }),
  head: () => ({ meta: [
    { title: 'Approve assistant access · PlantedAndSimple' },
    { name: 'description', content: 'Review and approve an assistant connection to your PlantedAndSimple account.' },
    { property: 'og:title', content: 'Approve assistant access · PlantedAndSimple' },
    { property: 'og:description', content: 'Secure assistant connection approval for PlantedAndSimple.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex,nofollow' },
  ] }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error('This approval request is missing. Start the connection again in your assistant.');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw redirect({ to: '/auth', search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get('authorization_id');
    if (!id) throw new Error('Missing approval request.');
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(id);
    if (error) throw error;
    if (data && 'redirect_url' in data && typeof data.redirect_url === 'string') throw redirect({ href: data.redirect_url });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => <main className="min-h-screen bg-background p-8 text-foreground"><h1 className="text-xl font-semibold">Connection unavailable</h1><p role="alert" className="mt-3">{error.message}</p></main>,
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details && 'client' in details ? details.client.name : 'your assistant';
  async function decide(approve: boolean) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      const result = approve
        ? await supabase.auth.oauth.approveAuthorization(authorization_id)
        : await supabase.auth.oauth.denyAuthorization(authorization_id);
      if (result.error) throw result.error;
      const target = result.data?.redirect_url;
      if (!target) throw new Error('Approval did not return a destination. Start the connection again.');
      window.location.assign(target);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete approval.'); setBusy(false); }
  }
  return <main className="min-h-screen bg-background px-6 py-20 text-foreground">
    <section className="mx-auto max-w-lg space-y-6">
      <p className="font-display text-xl text-primary">Planted &amp; Simple</p>
      <h1 className="text-3xl font-semibold">Connect {name}</h1>
      <p className="text-muted-foreground">This assistant can use your account’s permissions to read site analytics and prices, and manage recipes and articles, including publishing and deleting content.</p>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <div className="flex gap-3"><Button disabled={busy} onClick={() => decide(true)}>Approve connection</Button><Button variant="outline" disabled={busy} onClick={() => decide(false)}>Deny</Button></div>
    </section>
  </main>;
}