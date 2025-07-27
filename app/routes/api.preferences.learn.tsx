import { json, type ActionFunctionArgs } from '@remix-run/node';
import { createSupabaseServerClient } from '~/lib/supabase.server';
import { recordLearningEvent } from '~/lib/preferences.server';
import { requireAuth } from '~/lib/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { user, response: authResponse } = await requireAuth(request);
  if (!user) return authResponse;

  try {
    const formData = await request.json();
    const { eventType, targetType, targetId, metadata } = formData;

    // 입력 검증
    if (!eventType || !targetType || !targetId) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validEventTypes = ['like', 'dislike', 'visit', 'view', 'skip', 'save', 'share'];
    const validTargetTypes = ['place', 'course', 'category'];

    if (!validEventTypes.includes(eventType)) {
      return json({ error: 'Invalid event type' }, { status: 400 });
    }

    if (!validTargetTypes.includes(targetType)) {
      return json({ error: 'Invalid target type' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient(request);
    const success = await recordLearningEvent(supabase, user.id, {
      eventType,
      targetType,
      targetId,
      metadata,
    });

    if (!success) {
      return json({ error: 'Failed to record learning event' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error in preferences learn API:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}