import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";

function CustomAdapter() {
  const base = PrismaAdapter(prisma) as any;
  return {
    ...base,
    async createUser(data: any) {
      const githubId = (data as any).githubId;
      const login = (data as any).login;
      if (githubId) {
        const existing = await prisma.user.findUnique({ where: { githubId } });
        if (existing) return existing as any;
      }
      const cleaned = { ...data } as any;
      delete cleaned.githubId;
      delete cleaned.login;
      const user = await base.createUser!(cleaned);
      if (githubId || login) {
        await prisma.user.update({
          where: { id: user.id },
          data: { ...(githubId ? { githubId } : {}), ...(login ? { login } : {}) },
        });
      }
      return { ...user, githubId, login } as any;
    },
    async linkAccount(data: any) {
      const cleaned = { ...data } as any;
      delete cleaned.refresh_token_expires_in;
      try {
        return await base.linkAccount!(cleaned);
      } catch (e: any) {
        if (e.code === "P2002") return cleaned;
        throw e;
      }
    },
  } as any;
}

export const authOptions: NextAuthOptions = {
  adapter: CustomAdapter(),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: { params: { scope: "read:user public_repo" } },
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          login: profile.login,
          githubId: profile.id.toString(),
        } as any;
      },
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email!, name: user.name || undefined, image: user.image || undefined } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        (token as any).login = (profile as any).login;
        (token as any).githubId = (profile as any).id?.toString();
        (token as any).accessToken = (account as any).access_token;
      }
      if (user) {
        (token as any).uid = (user as any).id;
      }
      if (!(token as any).accessToken && (token as any).uid) {
        const githubAccount = await prisma.account.findFirst({
          where: { userId: (token as any).uid as string, provider: "github" },
          select: { access_token: true },
        });
        if (githubAccount?.access_token) {
          (token as any).accessToken = githubAccount.access_token;
        }
      }
      if (!(token as any).login && (token as any).uid) {
        const user = await prisma.user.findUnique({
          where: { id: (token as any).uid as string },
          select: { login: true, githubId: true },
        });
        if (user?.login) {
          (token as any).login = user.login;
          (token as any).githubId = user.githubId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).login = (token as any).login;
      (session.user as any).githubId = (token as any).githubId;
      (session as any).accessToken = (token as any).accessToken;
      (session.user as any).id = (token as any).uid || (token as any).sub;
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};
