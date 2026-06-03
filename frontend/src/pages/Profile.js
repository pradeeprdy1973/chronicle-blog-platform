import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', avatar: '' });

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    // Get all posts and filter by author
    api.get('/posts', { params: { limit: 100 } })
      .then(res => {
        const authorPosts = res.data.posts.filter(p => p.author?.username === username);
        setPosts(authorPosts);
        if (authorPosts.length > 0) setProfile(authorPosts[0].author);
        else if (isOwn) setProfile(currentUser);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username, isOwn, currentUser]);

  useEffect(() => {
    if (isOwn && currentUser) {
      setProfile(currentUser);
      setEditForm({ bio: currentUser.bio || '', avatar: currentUser.avatar || '' });
    }
  }, [currentUser, isOwn]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;

  return (
    <div className="profile-page fade-in">
      <div className="container">
        <div className="profile-header card">
          <div className="profile-avatar-wrap">
            <div className="avatar avatar-xl">
              {profile?.avatar ? <img src={profile.avatar} alt="" /> : (username?.[0]?.toUpperCase() || '?')}
            </div>
          </div>
          <div className="profile-info">
            <h1 className="profile-username">@{username}</h1>
            {!editing ? (
              <>
                <p className="profile-bio">{profile?.bio || 'No bio yet.'}</p>
                {profile?.created_at && (
                  <p className="profile-joined">Member since {format(new Date(profile.created_at), 'MMMM yyyy')}</p>
                )}
                {isOwn && <button onClick={() => { setEditing(true); }} className="btn-secondary" style={{marginTop:12,fontSize:14}}>Edit profile</button>}
              </>
            ) : (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Bio</label>
                  <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows={2} placeholder="Tell us about yourself…" />
                </div>
                <div className="form-group">
                  <label>Avatar URL</label>
                  <input value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} placeholder="https://…" />
                </div>
                <div className="profile-edit-actions">
                  <button onClick={handleSaveProfile} className="btn-primary" style={{fontSize:14}}>Save</button>
                  <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                </div>
              </div>
            )}
          </div>
          <div className="profile-stats">
            <div className="profile-stat"><strong>{posts.length}</strong><span>Stories</span></div>
            <div className="profile-stat"><strong>{posts.reduce((a,p) => a + (p.likeCount||0), 0)}</strong><span>Likes</span></div>
            <div className="profile-stat"><strong>{posts.reduce((a,p) => a + (p.views||0), 0)}</strong><span>Views</span></div>
          </div>
        </div>

        <div className="profile-posts-header">
          <h2>Stories by {username}</h2>
          {isOwn && <Link to="/write" className="btn-primary" style={{fontSize:14}}>+ New story</Link>}
        </div>

        {posts.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">✍️</p>
            <h3>No stories yet</h3>
            {isOwn && <p><Link to="/write">Write your first story</Link></p>}
          </div>
        ) : (
          <div className="profile-posts-grid">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}
