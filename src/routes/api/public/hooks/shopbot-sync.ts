import { createFileRoute } from '@tanstack/react-router';

// Scheduled refresh requires a configured server credential, not a bearer prefix.
export const Route = createFileRoute('/api/public/hooks/shopbot-sync')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.SHOPBOT_API_KEY;
        if (!key || request.headers.get('authorization') !== `Bearer ${key}`) return Response.json({ error: 'Unauthorized' }, { status: 401 });
        try {
          const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
          const { syncShopbotCatalog } = await import('@/lib/shopbot.server');
          return Response.json({ ok: true, ...(await syncShopbotCatalog(supabaseAdmin)) });
        } catch (e) {
          console.error('shopbot sync failed', e);
          return Response.json({ ok: false }, { status: 502 });
        }
      },
    },
  },
});
