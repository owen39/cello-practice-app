import { useEffect, useState } from 'react';
import { Library } from './Library';
import { Today } from './Today';
import { Overview } from './Overview';
import { History } from './History';
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
  useEffect(() => {
    let mounted = true;
    repository.initialize().then(() => { if (mounted) setReady(true); })
      .catch((cause: unknown) => { if (mounted) setError(cause instanceof Error ? cause.message : 'Could not open local storage.'); });
    return () => { mounted = false; };
  }, []);

  return <div className="app">
    <header className="masthead">
      <div className="masthead-inner">
        <span className="brand-mark" aria-hidden="true">♪</span>
        <div><p className="eyebrow">Your practice, your pace</p><strong>Cello Practice</strong></div>
      </div>
    </header>
    <main id="main-content" className="content">
      <div className="intro"><p className="eyebrow">Practice companion</p><h1>{page}</h1><p>{descriptions[page]}</p></div>
      {error ? <p role="alert" className="notice error">{error}</p> : !ready ? <p role="status">Opening your practice library…</p> :
        page === 'Library' ? <Library /> : page === 'Today' ? <Today /> : page === 'Overview' ? <Overview /> : <History />}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{pages.map((item) => <button key={item} type="button" className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => setPage(item)}>{item}</button>)}</nav>
  </div>;
}
