import { useEffect, useState } from 'react';
import type { Area } from './domain';
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    repository.initialize()
      .then(() => repository.listAreas())
      .then((savedAreas) => { if (mounted) setAreas(savedAreas); })
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
      {error ? <p role="alert" className="notice error">{error}</p> :
        page === 'Library' ? <section className="card"><h2>Practice areas</h2><p>Your starting areas are ready. Exercise management arrives in the next slice.</p><ul className="area-list">{areas.map((area) => <li key={area.id}>{area.name}</li>)}</ul></section> :
        <section className="card empty"><span aria-hidden="true">♫</span><h2>{page === 'Today' ? 'A fresh page for today' : page === 'Overview' ? 'A clearer picture is coming' : 'Your history begins here'}</h2><p>{page === 'Today' ? 'The next slice will let you add exercises and choose from them freely.' : page === 'Overview' ? 'Recent practice will appear here once logging is available.' : 'Practice you record will be listed by day here.'}</p></section>}
    </main>
    <nav className="bottom-nav" aria-label="Main navigation">{pages.map((item) => <button key={item} type="button" className={page === item ? 'active' : ''} aria-current={page === item ? 'page' : undefined} onClick={() => setPage(item)}>{item}</button>)}</nav>
  </div>;
}
