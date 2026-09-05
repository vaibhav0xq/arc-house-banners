import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[var(--background)] p-4">
      <div className="paper-sheet p-8 sm:p-12 max-w-md w-full text-center relative rotate-1">
        {/* Folded corner effect */}
        <div className="absolute top-0 right-0 w-8 h-8 bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] border-b border-l border-[color-mix(in_srgb,var(--ink)_10%,transparent)] shadow-sm rounded-bl" />
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[32px] border-l-[32px] border-t-transparent border-l-[var(--background)]" />

        <div className="text-6xl font-display font-extrabold text-[var(--accent)] mb-4">404</div>
        <h1 className="font-display text-2xl font-bold mb-4 text-[var(--ink)]">Page not found</h1>
        <p className="opacity-70 mb-8 font-medium">There is nothing at this address. The banner studio is on the home page.</p>

        <Link href="/" className="btn btn-primary btn-md w-full">
          Go to the studio
        </Link>
      </div>
    </div>
  );
}
