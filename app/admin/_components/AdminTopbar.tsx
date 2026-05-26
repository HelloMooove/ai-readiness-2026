import Link from 'next/link';

// Shared topbar for authenticated admin pages. The login page does NOT use
// this — only post-login pages get the nav. Pass `current` to highlight the
// active section.
export type AdminSection = 'home' | 'submissions' | 'insights';

type Props = {
  email: string;
  current: AdminSection;
};

const NAV: { id: AdminSection; label: string; href: string }[] = [
  { id: 'home',        label: 'Dashboard',   href: '/admin' },
  { id: 'submissions', label: 'Submissions', href: '/admin/submissions' },
  { id: 'insights',    label: 'Insights',    href: '/admin/insights' },
];

export default function AdminTopbar({ email, current }: Props) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <Link href="/admin" className="admin-brand">MOOOVE Admin</Link>
        <nav className="admin-nav" aria-label="Admin sections">
          {NAV.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={'admin-nav-link' + (item.id === current ? ' is-active' : '')}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="admin-user">
        <span className="admin-user-email">{email}</span>
        <form action="/auth/signout" method="POST">
          <button type="submit" className="admin-btn admin-btn-ghost">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
