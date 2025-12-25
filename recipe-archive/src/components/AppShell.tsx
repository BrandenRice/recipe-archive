/**
 * AppShell component - Main application layout with navigation
 * Requirements: 2.1
 */

import { NavLink, Outlet } from 'react-router-dom';
import './AppShell.css';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <img src="/logo.svg" alt="Recipe Archive" className="app-logo" />
          <h1 className="app-title">Recipe Archive</h1>
        </div>
        <nav className="app-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            end
          >
            Recipes
          </NavLink>
          <NavLink 
            to="/new" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            New Recipe
          </NavLink>
          <NavLink 
            to="/templates" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Templates
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
