import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { connectDB } from '@/lib/db'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [

    // ─────────────────────────────────────────────────────────
    // Credentials Login
    // ─────────────────────────────────────────────────────────
    CredentialsProvider({
      name: 'credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },

        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {

        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        const user = await User.findOne({
          email: credentials.email,
        }).select('+password')

        if (!user) {
          throw new Error('No account found with this email')
        }

        const isValid = await user.comparePassword(
          credentials.password
        )

        if (!isValid) {
          throw new Error('Incorrect password')
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        }
      },
    }),

    // ─────────────────────────────────────────────────────────
    // Google Login
    // ─────────────────────────────────────────────────────────
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],

  callbacks: {

    // ─────────────────────────────────────────────────────────
    // JWT CALLBACK
    // ─────────────────────────────────────────────────────────
    async jwt({ token, user, trigger, session, account }) {

      // Initial login
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
        token.role = (user as { role?: string }).role ?? 'user'
      }

      // Profile update
      if (trigger === 'update' && session?.name) {
        token.name = session.name
      }

      // Google OAuth
      if (account?.provider === 'google' && token.email) {

        await connectDB()

        const dbUser = await User.findOneAndUpdate(
          {
            email: token.email,
          },
          {
            $set: {
              name: token.name,
              image: token.picture,
            },

            $setOnInsert: {
              emailVerified: new Date(),
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        )

        token.id = dbUser._id.toString()
        token.role = dbUser.role ?? 'user'
      }

      return token
    },

    // ─────────────────────────────────────────────────────────
    // SESSION CALLBACK
    // ─────────────────────────────────────────────────────────
    async session({ session, token }) {

      if (session.user) {

        session.user.id = token.id as string

        session.user.name = token.name as string

        session.user.email = token.email as string

        session.user.image = token.picture as string

        session.user.role = token.role as string
      }

      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
}