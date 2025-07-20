import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Temporarily disable all middleware to test
  // We'll add protection back once login flow is working
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
