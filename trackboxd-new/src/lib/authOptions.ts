import { createClient } from "@/lib/supabase/server";
import { createAuthClient } from "@/lib/supabase/auth-server";
import NextAuth, {
    type NextAuthOptions,
    DefaultSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { cookies } from "next/headers";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            email: string;
            name: string;
            image?: string | null;
        };
    }
    interface User {
        id: string;
        email: string;
        name: string;
        image?: string | null;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials");
                    return null;
                }

                try {
                    const supabaseAuth = createAuthClient();
                    const supabase = createClient(cookies());
                    
                    console.log("Attempting to sign in with email:", credentials.email);
                    
                    // Sign in with Supabase Auth using service role
                    const { data, error } = await supabaseAuth.auth.signInWithPassword({
                        email: credentials.email,
                        password: credentials.password,
                    });

                    if (error) {
                        console.error("Supabase auth error:", error);
                        return null;
                    }

                    if (!data.user) {
                        console.log("No user data returned from Supabase");
                        return null;
                    }

                    console.log("Supabase auth successful, user ID:", data.user.id);

                    // Get user profile from public.users table using regular client
                    const { data: userProfile, error: profileError } = await supabase
                        .from("users")
                        .select("*")
                        .eq("id", data.user.id)
                        .single();

                    if (profileError) {
                        console.error("Error fetching user profile:", profileError);
                        return null;
                    }

                    console.log("User profile found:", userProfile);

                    return {
                        id: data.user.id,
                        email: data.user.email!,
                        name: userProfile.name,
                        image: userProfile.image_url,
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    },
    cookies: {
        sessionToken: {
            name: `${
                process.env.NODE_ENV === "production" ? "__Secure-" : ""
            }next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",
};
