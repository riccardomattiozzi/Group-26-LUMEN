// Application bar: the product name and what this screen is, on one quiet
// line that stays put while the page scrolls. The page's own heading and
// context live in DecisionFraming, directly underneath.
export function Navbar() {
  return (
    <header className="toolbar sticky top-0 z-40">
      <div className="mx-auto flex h-[var(--nav-h)] max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <span className="text-[0.9375rem] font-semibold text-foreground">LUMEN</span>
        <span aria-hidden className="h-4 w-px bg-line" />
        <span className="min-w-0 truncate text-sm text-foreground-soft">
          Germany launch simulator
        </span>
        <span className="ml-auto hidden text-xs text-foreground-faint sm:inline">
          Pricing &amp; go-to-market · Year 1
        </span>
      </div>
    </header>
  );
}
