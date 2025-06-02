import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      email: string
      name: string
      role: string
      initials: string
    }
  }

  interface User {
    id: string
    username: string
    email: string
    name: string
    role: string
    initials: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    username: string
    initials: string
  }
}