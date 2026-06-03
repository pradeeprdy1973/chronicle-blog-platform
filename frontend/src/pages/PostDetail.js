import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './PostDetail.css';

function Comment({ comment, postSlug, onUpdate, depth = 0 }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyVal, setReplyVal] = useState('');
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const handleEdit = async () => {
    if (!editVal.trim()) return;
    try {
      await api.put(`/posts/${postSlug}/comments/${comment.id}`, { content: editVal });
      setEditing(false); onUpdate();
    } catch (err) { toast.error('Failed to update'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    try { await api.delete(`/posts/${postSlug}/comments/${comment.id}`); onUpdate(); toast.success('Deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleReply = async () => {
    if (!replyVal.trim()) return;
    try {
      await api.post(`/posts/${postSlug}/comments`, { content: replyVal, parent_id: comment.id });
      setReplyVal(''); setReplying(false); onUpdate();
    } catch { toast.error('Failed to post reply'); }
  };

  return (
    <div className={`comment ${depth > 0 ? 'reply' : ''}`}>
      <div className="comment-header">
        <Link to={`/profile/${comment.author?.username}`} className="comment-author">
          <div className="avatar" style={{width:28,height:28,fontSize:12}}>
            {comment.author?.avatar ? <img src={comment.author.avatar} alt="" /> : comment.author?.username?.[0]?.toUpperCase()}
          </div>
          <strong>{comment.author?.username}</strong>
        </Link>
        <time>{timeAgo}</time>
      </div>

      {editing ? (
        <div className="comment-edit">
          <textarea value={editVal} onChange={e => setEditVal(e.target.value)} rows={3} />
          <div className="comment-edit-actions">
            <button onClick={handleEdit} className="btn-primary" style={{padding:'6px 16px',fontSize:14}}>Save</button>
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="comment-body">{comment.content}</p>
      )}

      <div className="comment-actions">
        {user && depth === 0 && (
          <button onClick={() => setReplying(r => !r)} className="btn-ghost comment-action-btn">
            {replying ? 'Cancel' : 'Reply'}
          </button>
        )}
        {user?.id === comment.author_id && !editing && (
          <>
            <button onClick={() => setEditing(true)} className="btn-ghost comment-action-btn">Edit</button>
            <button onClick={handleDelete} className="btn-ghost comment-action-btn danger">Delete</button>
          </>
        )}
      </div>

      {replying && (
        <div className="reply-form">
          <textarea value={replyVal} onChange={e => setReplyVal(e.target.value)} placeholder={`Reply to ${comment.author?.username}…`} rows={2} />
          <button onClick={handleReply} className="btn-primary" style={{padding:'7px 16px',fontSize:14}}>Post reply</button>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className="replies">
          {comment.replies.map(r => <Comment key={r.id} comment={r} postSlug={postSlug} onUpdate={onUpdate} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function PostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const fetchPost = () => api.get(`/posts/${slug}`).then(r => { setPost(r.data); setLiked(r.data.liked); setLikeCount(r.data.likeCount); });
  const fetchComments = () => api.get(`/posts/${slug}/comments`).then(r => setComments(r.data));

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()])
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like posts'); return; }
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikeCount(c => res.data.liked ? c + 1 : c - 1);
    } catch { toast.error('Failed to like'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try { await api.delete(`/posts/${post.id}`); toast.success('Post deleted'); navigate('/'); }
    catch { toast.error('Failed to delete'); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/posts/${slug}/comments`, { content: newComment });
      setNewComment(''); fetchComments();
    } catch { toast.error('Failed to post comment'); }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!post) return null;

  const isAuthor = user?.id === post.author?.id;

  return (
    <div className="post-detail fade-in">
      <div className="container-narrow">
        {post.cover_image && <img src={post.cover_image} alt={post.title} className="post-cover" />}

        <header className="post-header">
          <div className="post-tags-row">
            {(post.tags || []).map(t => <Link key={t} to={`/?tag=${t}`} className="tag">{t}</Link>)}
          </div>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta-row">
            <Link to={`/profile/${post.author?.username}`} className="post-author-link">
              <div className="avatar avatar-lg">
                {post.author?.avatar ? <img src={post.author.avatar} alt="" /> : post.author?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div className="author-name">{post.author?.username}</div>
                <div className="post-date">{format(new Date(post.created_at), 'MMMM d, yyyy')} · {post.views} views</div>
              </div>
            </Link>
            {isAuthor && (
              <div className="post-owner-actions">
                <Link to={`/edit/${post.slug}`} className="btn-secondary" style={{padding:'7px 16px',fontSize:14}}>Edit</Link>
                <button onClick={handleDelete} className="btn-danger" style={{padding:'7px 16px',fontSize:14}}>Delete</button>
              </div>
            )}
          </div>
        </header>

        <hr className="rule" />

        <article className="post-content">
          <div style={{whiteSpace:'pre-wrap', lineHeight:1.85}}>{post.content}</div>
        </article>

        <div className="post-engagement">
          <button onClick={handleLike} className={`like-btn ${liked ? 'liked' : ''}`}>
            {liked ? '♥' : '♡'} {likeCount}
          </button>
          <span className="engagement-sep">·</span>
          <span>{comments.length} comments</span>
        </div>

        <hr className="rule" />

        <section className="comments-section">
          <h2 className="comments-title">Discussion</h2>

          {user ? (
            <form onSubmit={handleComment} className="comment-form">
              <div className="avatar" style={{width:36,height:36,fontSize:14,flexShrink:0}}>
                {user.avatar ? <img src={user.avatar} alt="" /> : user.username[0].toUpperCase()}
              </div>
              <div className="comment-form-inner">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Share your thoughts…" rows={3} />
                <button type="submit" className="btn-primary" style={{alignSelf:'flex-end',padding:'8px 20px',fontSize:14}}>Post comment</button>
              </div>
            </form>
          ) : (
            <p className="login-to-comment">
              <Link to="/login">Sign in</Link> to join the discussion.
            </p>
          )}

          <div className="comments-list">
            {comments.length === 0 && <p className="no-comments">No comments yet. Be the first!</p>}
            {comments.map(c => <Comment key={c.id} comment={c} postSlug={slug} onUpdate={fetchComments} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
