import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const tag = searchParams.get('tag');
  const searchQ = searchParams.get('search');

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 9 };
    if (tag) params.tag = tag;
    if (searchQ) params.search = searchQ;
    api.get('/posts', { params })
      .then(res => { setPosts(res.data.posts); setTotalPages(res.data.totalPages); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, tag, searchQ]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    if (search.trim()) setSearchParams({ search: search.trim() });
    else setSearchParams({});
  };

  const clearFilter = () => { setSearchParams({}); setSearch(''); setPage(1); };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="home-page">
      <header className="home-hero">
        <div className="container">
          <div className="hero-content">
            <p className="hero-eyebrow">The Chronicle</p>
            <h1 className="hero-title">Ideas worth reading.</h1>
            <p className="hero-sub">Stories, perspectives, and craft from writers who mean it.</p>
            <form onSubmit={handleSearch} className="search-form">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search stories…"
                className="search-input"
              />
              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>
        </div>
        <div className="hero-ornament">✦</div>
      </header>

      <main className="container home-main">
        {(tag || searchQ) && (
          <div className="filter-bar">
            <span className="filter-label">
              {tag ? <>Stories tagged <strong>#{tag}</strong></> : <>Results for <strong>"{searchQ}"</strong></>}
            </span>
            <button onClick={clearFilter} className="btn-ghost">Clear ×</button>
          </div>
        )}

        {loading ? (
          <div className="page-loading"><div className="loading-spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">📄</p>
            <h3>No stories found</h3>
            <p>Try a different search or <Link to="/write">write the first one</Link>.</p>
          </div>
        ) : (
          <>
            {!tag && !searchQ && featured && page === 1 && (
              <section className="featured-section">
                <h2 className="section-label">Featured</h2>
                <PostCard post={featured} featured />
              </section>
            )}

            <section className="posts-grid-section">
              {(!tag && !searchQ && page === 1 ? rest : posts).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </section>

            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary">← Previous</button>
                <span className="page-info">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary">Next →</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
