/** Paths reachable without staff login (hotel guest experience). */
export const GUEST_PUBLIC_PATH_PATTERNS = [
  /^\/hotel\/[^/]+$/,
  /^\/hotel\/[^/]+\/order\/[^/]+$/,
] as const

export function isGuestPublicPath(pathname: string): boolean {
  return GUEST_PUBLIC_PATH_PATTERNS.some((re) => re.test(pathname))
}
