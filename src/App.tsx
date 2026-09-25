import { useEffect, useRef, useState } from 'react';
import { Library } from './Library';
import { Today } from './Today';
import { Overview } from './Overview';
import { History } from './History';
import { BackupReminder } from './BackupReminder';
import { repository } from './storage';

type Page = 'Today' | 'Library' | 'Overview' | 'History';
const pages: Page[] = ['Today', 'Library', 'Overview', 'History'];

const descriptions: Record<Page, string> = {
  Today: 'Choose what feels useful to practice today.',
  Library: 'Keep your exercises organized by practice area.',
  Overview: 'See when and how often you have practiced.',
  History: 'Look back at the practice you recorded.'
};

export function App() {
  const [page, setPage] = useState<Page>('Today');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let mounted = true;
    repository.initialize().then(() => { if (mounted) setReady(true); })
      .catch((cause: unknown) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Could not open local storage.'); });
    return () => { mounted = false; };
  }, []);

  function navigate(item: Page) {
    setPage(item);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      heading.current?.focus({ preventScroll: true });
    });
  }

  return <div className="app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="masthead">
      <div className="masthead-inner">
        <span className="brand-mark" aria-hidden="true">♪</span>
        <div><p className="eyebrow">Your practice, your pace</p><strong>Cello Practice</strong></div>
      </div>
    </header>
    <main id="main-content" className="content" tabIndex={-1}>
      <div className="intro"><p className="eyebrow">Practice companion</p><h1 ref={heading} tabIndex={-1} aria-live="polite">{page}</h1><p>{descriptions[page]}</p></div>
      {error ? <p role="alert" className="notice error">{error}</p> : !ready ? <p role="status">Opening your practice library…</p> :
        page === 'Library' ? <Library /> : page === 'Today' ? <Today onOpenLibrary={() => navigate('Library')} /> : page === 'Overview' ? <Overview /> : <History />}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{pages.map((item) => <button key={item} type="button" className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => navigate(item)}>{item}</button>)}</nav>
    {ready && <BackupReminder />}
  </div>;
}
