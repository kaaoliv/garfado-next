import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname !== '/') return NextResponse.next()

  const ua = request.headers.get('user-agent') || ''
  const isMobile = /android|iphone|ipad|ipod|mobile|phone/i.test(ua)

  if (!isMobile) {
    return NextResponse.redirect(new URL('/landing', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/'],
}
