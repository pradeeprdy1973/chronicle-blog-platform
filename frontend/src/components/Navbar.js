import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">✦</span>
          <span className="brand-name">The Chronicle</span>
        </Link>

        <div className="navbar-center">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Stories</Link>
          {user && <Link to="/write" className={`nav-link ${location.pathname === '/write' ? 'active' : ''}`}>Write</Link>}
        </div>

        <div className="navbar-right">
          {user ? (
            <div className="nav-user">
              <Link to={`/profile/${user.username}`} className="user-chip">
                <div className="avatar avatar-sm">
                  {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
                </div>
                <span className="username-display">{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost logout-btn">Sign out</button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-primary">Join</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
