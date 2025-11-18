import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      first_name: string
      last_name: string
      roles: any[]
      access_token: string
      refresh_token: string
      image?: string
      role?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    first_name: string
    last_name: string
    roles: any[]
    access_token: string
    refresh_token: string
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token: string
    refresh_token: string
    roles: any[]
    first_name: string
    last_name: string
  }
}
