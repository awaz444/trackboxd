import { VIP_USERS } from "@/lib/vipUsers";

export function VipBadge({ username }: { username: string }) {
  if (!VIP_USERS.has(username.toLowerCase())) return null;
  return (
    <img
      src="/logo.svg"
      alt="VIP"
      className="inline-block w-3.5 h-3.5 flex-shrink-0"
      title="VIP member"
    />
  );
}
