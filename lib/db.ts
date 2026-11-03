import { PrismaClient } from '@prisma/client'

const getCleanDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || ''
  if (!url) return url

  // If port 6543 (PgBouncer transaction pooler) is used without pgbouncer=true, append it to prevent 'prepared statement already exists' error
  if (url.includes(':6543') && !url.includes('pgbouncer=true')) {
    url += (url.includes('?') ? '&' : '?') + 'pgbouncer=true'
  }
  return url
}

const prismaClientSingleton = () => {
  const url = getCleanDatabaseUrl()
  return new PrismaClient(
    url
      ? {
          datasources: {
            db: {
              url,
            },
          },
        }
      : undefined
  )
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

globalThis.prisma = prisma

