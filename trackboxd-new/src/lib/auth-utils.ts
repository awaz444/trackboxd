import { createClient } from "@/lib/supabase/client";

/**
 * Utility function to find user by name or email
 * This is used to support login with either name (username) or email
 */
export async function findUserByNameOrEmail(identifier: string) {
  const supabase = createClient();
  
  // First try to find by email
  const { data: userByEmail, error: emailError } = await supabase
    .from("users")
    .select("email")
    .eq("email", identifier)
    .single();

  if (userByEmail && !emailError) {
    return userByEmail.email;
  }

  // If not found by email, try to find by name (username)
  const { data: userByName, error: nameError } = await supabase
    .from("users")
    .select("email")
    .eq("name", identifier)
    .single();

  if (userByName && !nameError) {
    return userByName.email;
  }

  return null;
}

/**
 * Check if username (name) is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("users")
    .select("name")
    .eq("name", username)
    .single();

  // If no data found, username is available
  return !data;
}

/**
 * Check if email is available
 */
export async function isEmailAvailable(email: string): Promise<boolean> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  // If no data found, email is available
  return !data;
}
