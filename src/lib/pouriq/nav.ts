export interface NavItem { label: string; href: string }
export interface NavGroup { label: string; items: NavItem[] }

const HOME = '/trade/pouriq'

// Slice 1 of the UI redesign: only items with a destination today. Deferred
// items (Dashboard, Sales & performance, Tasks & alerts, a global Cocktails &
// spec cards, Imports, Team & locations) are added as their screens ship.
export const NAV_GROUPS: NavGroup[] = [
  { label: 'Operate', items: [
    { label: 'Dashboard', href: HOME },
    { label: 'Variance', href: '/trade/pouriq/variance' },
    { label: 'Stock', href: '/trade/pouriq/stock' },
  ] },
  { label: 'Build', items: [
    { label: 'Menus', href: '/trade/pouriq/menus' },
    { label: 'Ingredients', href: '/trade/pouriq/library' },
    { label: 'Serves', href: '/trade/pouriq/serves' },
    { label: 'Suppliers & invoices', href: '/trade/pouriq/invoices' },
  ] },
  { label: 'Connect', items: [
    { label: 'Integrations', href: '/trade/pouriq/settings/integrations' },
  ] },
  { label: 'Settings', items: [
    { label: 'Voice profile', href: '/trade/pouriq/settings/voice-profile' },
    { label: 'Help', href: '/trade/pouriq/help' },
  ] },
]

// The home item matches only its exact path; every other item also matches its
// sub-routes (e.g. /library/new highlights Ingredients).
export function isNavActive(pathname: string, href: string): boolean {
  if (href === HOME) return pathname === HOME
  return pathname === href || pathname.startsWith(href + '/')
}

// True on the authenticated Pour IQ app (its own chrome), false on marketing
// routes and the public /trade entry pages (login/apply/landing).
export function isPourIqAppRoute(pathname: string | null): boolean {
  return pathname != null && (pathname === HOME || pathname.startsWith(HOME + '/'))
}
