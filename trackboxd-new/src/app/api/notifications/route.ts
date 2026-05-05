import { getServerUser } from "@/lib/supabase/get-server-user";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient(cookies());

    // Use raw SQL query to fetch notifications with source user details
    const { data: notifications, error } = await supabase.rpc('get_user_notifications', {
      p_user_id: user.id
    });

    if (error) {
      // If RPC doesn't exist, fall back to manual join
      const { data: rawNotifications, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Manually fetch user details for each notification
      const notificationsWithUsers = await Promise.all(
        (rawNotifications || []).map(async (notification) => {
          const { data: userData } = await supabase
            .from("users")
            .select("id, name, image_url")
            .eq("id", notification.source_id) 
            .single();

          let details = null;
          if (notification.type === 'like' && notification.target_id) {
            // Try fetching review details
            const { data: review } = await supabase
              .from('reviews')
              .select('text, item_id')
              .eq('id', notification.target_id)
              .single();

            if (review) {
              // Fetch item name
              const { data: item } = await supabase
                .from('spotify_items')
                .select('name')
                .eq('id', review.item_id)
                .single();
                
              details = { 
                type: 'review', 
                text: review.text, 
                itemName: item?.name 
              };
            } else {
              // Try fetching annotation details
              const { data: annotation } = await supabase
                .from('annotations')
                .select('text, track_id')
                .eq('id', notification.target_id)
                .single();

              if (annotation) {
                // Fetch item name
                const { data: item } = await supabase
                  .from('spotify_items')
                  .select('name')
                  .eq('id', annotation.track_id)
                  .single();

                details = { 
                  type: 'annotation', 
                  text: annotation.text, 
                  itemName: item?.name 
                };
              }
            }
          }

          return {
            ...notification,
            source_user: userData,
            details
          };
        })
      );

      return NextResponse.json(notificationsWithUsers);
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const user = await getServerUser();
  
  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { notificationIds, markAll } = body;
    const supabase = createClient(cookies());

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (!markAll) {
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: "Invalid notification IDs" },
          { status: 400 }
        );
      }
      query = query.in("id", notificationIds);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
