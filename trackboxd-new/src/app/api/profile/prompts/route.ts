import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createClient(cookies());

    // New schema columns: id, prompt_text, expected_type, created_at
    // Frontend expects: id, key, question, type, order, active
    const { data, error } = await supabase
      .from('profile_prompts')
      .select('id, prompt_text, expected_type, created_at');

    if (error) {
      console.error('Failed to list profile prompts:', error);
      return NextResponse.json([]);
    }

    // Map to frontend shape: key (derive from prompt_text), question, type
    const mapped = (data || []).map((p: any, idx: number) => ({
      id: p.id,
      key: (p.prompt_text || '').toLowerCase().replace(/\s+/g, '_').slice(0, 48) || `prompt_${idx+1}`,
      question: p.prompt_text,
      type: p.expected_type as 'track'|'album'|'playlist',
      order: idx,
      active: true,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Failed to list profile prompts:', error);
    return NextResponse.json({ error: 'Failed to list prompts' }, { status: 500 });
  }
}