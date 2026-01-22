import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            name: "Admin Login",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Get admin credentials from environment variables
                const adminUsername = process.env.ADMIN_USERNAME || "admin";
                const adminPassword = process.env.ADMIN_PASSWORD || "kapunun2025";

                if (
                    credentials?.username === adminUsername &&
                    credentials?.password === adminPassword
                ) {
                    return {
                        id: "1",
                        name: "Administrator",
                        email: "admin@kapunun.local",
                        role: "admin",
                    };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLoginPage = nextUrl.pathname === "/login";

            if (isOnLoginPage) {
                if (isLoggedIn) {
                    return Response.redirect(new URL("/", nextUrl));
                }
                return true;
            }

            return isLoggedIn;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
});
