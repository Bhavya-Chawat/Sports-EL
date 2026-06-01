import { NavLink } from 'react-router-dom';
import { 
  Search
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/',             label: 'Dashboard' },
  { path: '/live',         label: 'Live Assistant' },
  { path: '/substitution', label: 'Recommendations' },
  { path: '/players-teams',label: 'Players & Teams' },
  { path: '/intelligence', label: 'System Intelligence' }
];

export default function Header() {
  return (
    <header className="pkl-header">
      {/* Main Navigation Bar */}
      <div className="pkl-navbar">
        <div className="pkl-navbar-container">
          {/* Logo Branding */}
          <div className="pkl-logo-wrapper">
            <NavLink to="/" className="pkl-logo-link">
              <span className="pkl-logo-gold">Kabaddi</span>
              <span className="pkl-logo-iq shiny-text">IQ</span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="pkl-nav-menu">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `pkl-nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: Search Outline */}
          <div className="pkl-nav-right">
            <button className="pkl-search-btn" title="Search player, team or metric">
              <Search size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

