import "next-auth/jwt";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
    id?: string;
  }
}