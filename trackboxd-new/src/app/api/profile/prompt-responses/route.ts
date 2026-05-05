import { getServerUser } from "@/lib/supabase/get-server-user";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { getTrackDetails, getAlbumDetails, getPlaylistDetails } from '@/lib/spotify';

// GET: list responses for a given username or for current user if not provided
export async function GET(request: Request) {
  try {
    const supabase = createClient(cookies());
    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    let userId: string | null = null;
    if (username) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('name', username)
        .single();
      userId = user?.id || null;
    } else {
      const user = await getServerUser();
      userId = user?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: responses, error } = await supabase
      .from('user_profile_responses')
      .select(`
        id,
        custom_text,
        sort_order,
        created_at,
        profile_prompts:prompt_id (
          id,
          prompt_text,
          expected_type
        ),
        spotify_items:spotify_item_id (
          id,
          type,
          name,
          artist,
          album,
          duration_ms,
          cover_url,
          spotify_url
        )
      `)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Prompt responses fetch error:', error);
      return NextResponse.json([]);
    }

    const keyFrom = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '_').slice(0, 48);
    const formatted = (responses || []).map((r: any) => {
      const item = Array.isArray(r.spotify_items) ? r.spotify_items[0] : r.spotify_items;
      const promptText = r.profile_prompts?.prompt_text || '';
      const expectedType = r.profile_prompts?.expected_type as 'track'|'album'|'playlist'|undefined;
      return {
        id: r.id,
        prompt_id: r.profile_prompts?.id || null,
        promptKey: keyFrom(promptText),
        type: expectedType || (item?.type as 'track'|'album'|'playlist') || 'track',
        item: item ? { id: item.id, type: item.type, name: item.name, artist: item.artist, cover_url: item.cover_url } : null,
        text: r.custom_text || null,
        created_at: r.created_at,
      };
    });

    return NextResponse.json(formatted);
  } catch (e) {
    console.error('Failed to get prompt responses:', e);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

// POST: upsert a response for current user
export async function POST(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(cookies());

    const body = await request.json();
    const { promptKey, type, value } = body as { promptKey: string; type: 'text'|'track'|'album'|'playlist'; value: any };

    if (!promptKey || !type) {
      return NextResponse.json({ error: 'Missing promptKey or type' }, { status: 400 });
    }

    // Find prompt by key (derived from prompt_text)
    const keyFrom = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '_').slice(0, 48);
    const { data: prompts } = await supabase
      .from('profile_prompts')
      .select('id, prompt_text, expected_type');
    const targetPrompt = (prompts || []).find((p: any) => keyFrom(p.prompt_text) === promptKey);
    if (!targetPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 400 });
    }
    if (type === 'text') {
      // Schema requires spotify_item_id NOT NULL; text-only not supported
      return NextResponse.json({ error: 'Text responses not supported by schema' }, { status: 400 });
    }
    if (type !== targetPrompt.expected_type) {
      return NextResponse.json({ error: 'Response type does not match prompt expected_type' }, { status: 400 });
    }

    const id = typeof value === 'string' ? value : value?.id;
    if (!id) return NextResponse.json({ error: 'Item id required' }, { status: 400 });

    const { data: existingItem, error: fetchError } = await supabase
      .from('spotify_items')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError && (fetchError as any).code !== 'PGRST116') {
      console.warn('spotify_items fetch error:', fetchError);
    }

    if (!existingItem) {
      try {
        if (type === 'track') {
          const t = await getTrackDetails(id);
          const newItem = {
            id: t.id,
            type: 'track',
            name: t.name,
            artist: t.artists?.map((a: any) => a.name).join(', '),
            duration_ms: t.duration_ms ?? null,
            album: t.album?.name ?? null,
            cover_url: t.album?.images?.[0]?.url ?? null,
            spotify_url: t.external_urls?.spotify ?? null,
          };
          const { error: insErr } = await supabase.from('spotify_items').insert(newItem);
          if (insErr) throw insErr;
        } else if (type === 'album') {
          const a = await getAlbumDetails(id);
          const newItem = {
            id: a.id,
            type: 'album',
            name: a.name,
            artist: a.artists?.map((x: any) => x.name).join(', '),
            duration_ms: null,
            album: null,
            cover_url: a.images?.[0]?.url ?? null,
            spotify_url: a.external_urls?.spotify ?? null,
          };
          const { error: insErr } = await supabase.from('spotify_items').insert(newItem);
          if (insErr) throw insErr;
        } else if (type === 'playlist') {
          const p = await getPlaylistDetails(id);
          const newItem = {
            id: p.id,
            type: 'playlist',
            name: p.name,
            artist: p.owner?.display_name ?? null,
            duration_ms: null,
            album: null,
            cover_url: p.images?.[0]?.url ?? null,
            spotify_url: p.external_urls?.spotify ?? null,
          } as any;
          const { error: insErr } = await supabase.from('spotify_items').insert(newItem);
          if (insErr) throw insErr;
        }
      } catch (err) {
        console.error('Failed upserting spotify_items:', err);
        return NextResponse.json({ error: 'Failed to upsert item' }, { status: 500 });
      }
    }

    // Delete existing response for this prompt_id for user
    await supabase
      .from('user_profile_responses')
      .delete()
      .match({ user_id: user.id, prompt_id: targetPrompt.id });

    // Insert new response
    const insertPayload: any = {
      user_id: user.id,
      prompt_id: targetPrompt.id,
      spotify_item_id: id,
      custom_text: null,
      sort_order: 0,
    };
    const { data, error } = await supabase
      .from('user_profile_responses')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error) {
      console.error('Insert prompt response error:', error);
      return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error('Failed to save prompt response:', e);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}

// DELETE: remove a response for current user
export async function DELETE(request: Request) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(cookies());

    const body = await request.json();
    const { promptKey } = body as { promptKey: string };
    if (!promptKey) return NextResponse.json({ error: 'Missing promptKey' }, { status: 400 });

    const keyFrom = (s: string) => (s || '').toLowerCase().replace(/\s+/g, '_').slice(0, 48);
    const { data: prompts } = await supabase
      .from('profile_prompts')
      .select('id, prompt_text');
    const targetPrompt = (prompts || []).find((p: any) => keyFrom(p.prompt_text) === promptKey);
    if (!targetPrompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_profile_responses')
      .delete()
      .match({ user_id: user.id, prompt_id: targetPrompt.id });

    if (error) {
      console.error('Delete prompt response error:', error);
      return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete prompt response:', e);
    return NextResponse.json({ error: 'Failed to delete response' }, { status: 500 });
  }
}