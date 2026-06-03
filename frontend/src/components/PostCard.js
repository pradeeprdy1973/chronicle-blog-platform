import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './PostCard.css';

export default function PostCard({ post, featured = false }) {
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

  return (
    <article className={`post-card ${featured ? 'featured' : ''} fade-in`}>
      {post.cover_image && (
        <Link to={`/post/${post.slug}`} className="post-card-image">
          <img src={post.cover_image} alt={post.title} />
        </Link>
      )}
      <div className="post-card-body">
        <div className="post-card-meta">
          <Link to={`/profile/${post.author?.username}`} className="author-link">
            <div className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
              {post.author?.avatar ? <img src={post.author.avatar} alt="" /> : post.author?.username?.[0]?.toUpperCase()}
            </div>
            <span>{post.author?.username}</span>
          </Link>
          <span className="meta-sep">·</span>
          <time>{timeAgo}</time>
        </div>

        <h2 className="post-card-title">
          <Link to={`/post/${post.slug}`}>{post.title}</Link>
        </h2>

        {post.excerpt && (
          <p className="post-card-excerpt">{post.excerpt.slice(0, 140)}{post.excerpt.length > 140 ? '…' : ''}</p>
        )}

        <div className="post-card-footer">
          <div className="post-tags">
            {(post.tags || []).slice(0, 3).map(tag => (
              <Link key={tag} to={`/?tag=${tag}`} className="tag">{tag}</Link>
            ))}
          </div>
          <div className="post-stats">
            <span>♡ {post.likeCount || 0}</span>
            <span>◎ {post.commentCount || 0}</span>
            <span>◈ {post.views || 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
