import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Facebook, Instagram, Youtube, Twitter, Linkedin,
  MessageCircle, Mail, Search, ChevronDown, Menu, X,
  ArrowRight, BookOpen
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import UserAvatar from '../components/layout/UserAvatar'
import './LandingPage.css'

const CATEGORIES = [
  'House', 'Apartments', 'Design', 'Construction',
  'Building Materials', 'Renovation', 'Vastu', 'General'
]

const FEATURED_DOCS = [
  {
    id: 1, category: 'Construction',
    title: 'Supreme Court Mandates Stricter Quality Checks for Builders Nationwide',
    excerpt: 'New guidelines affecting all registered builders following ongoing structural complaints across major cities.',
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    author: 'Admin', date: 'May 20, 2026', featured: true
  },
  {
    id: 2, category: 'Design',
    title: 'Kerala Announces New Green Building Subsidies for 2026',
    excerpt: 'State government rolls out incentives for eco-friendly residential construction.',
    img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=600&q=80',
    author: 'Editor', date: 'May 19, 2026', featured: true
  },
  {
    id: 3, category: 'Building Materials',
    title: 'Cement Prices Drop Across South India Amid Import Surge',
    excerpt: 'Relief for homebuilders as cement costs fall for the third consecutive month.',
    img: 'https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=600&q=80',
    author: 'Reporter', date: 'May 18, 2026', featured: true
  },
]

const SIDEBAR_NEWS = [
  { id: 4, title: 'Top 10 Indian Architects Honored This Year', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&q=80', date: 'May 21' },
  { id: 5, title: 'Bamboo Construction Workshops See a Massive Surge Across South India', img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=120&q=80', date: 'May 20' },
  { id: 6, title: 'Smart Home Tech Expo Opens in Bangalore', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80', date: 'May 19' },
  { id: 7, title: 'Kochi Metro Phase 3 Real Estate Impact Shows Property Values Rising', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=120&q=80', date: 'May 18' },
  { id: 8, title: '3D Printed Concrete Homes Now Approved by City Council', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&q=80', date: 'May 17' },
  { id: 9, title: 'New Recycled Glass Bricks Unveiled at Construction Expo', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&q=80', date: 'May 16' },
]

const GRID_DOCS = [
  {
    id: 10, category: 'Renovation',
    title: 'Sustainable Building Materials Summit Opens Tomorrow in Central Kochi',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80',
    date: 'May 17, 2026'
  },
  {
    id: 11, category: 'Design',
    title: 'A Groundbreaking New AI Software Designed to Help Structural Engineers Predict Load Bearing Stress',
    img: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&q=80',
    date: 'May 16, 2026'
  },
  {
    id: 12, category: 'Construction',
    title: 'International Steel Imports From China Have Been Halted Indefinitely Due to New Federal Tariff Laws',
    img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    date: 'May 15, 2026'
  },
]

const YELLOW_SECTIONS = [
  'Did You Know?',
  "Celebrity's Homes",
  'Crazy Buildings',
  'User Blogs & Experts Corner',
  'Competitions / Awards / Interviews'
]

export default function LandingPage() {
  const { user } = useAuth()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [email,      setEmail]      = useState('')

  return (
    <div className="lp-root">

      {/* ── TOP UTILITY BAR ── */}
      <div className="lp-topbar">
        <div className="lp-topbar-inner">
<div className="lp-topbar-left">
  <a href="#" className="lp-topbar-link">Advertise With Us</a>
  <span className="lp-dot">•</span>
  <a href="#" className="lp-topbar-link">Help Us Improve</a>
</div>
<div className="lp-topbar-social">
  {user
    ? <UserAvatar dark={true} />
    : <Link to="/login" className="lp-topbar-link">Login / Sign Up</Link>
  }            {[
              { icon: Facebook,       href: '#' },
              { icon: Instagram,      href: '#' },
              { icon: Youtube,        href: '#' },
              { icon: Twitter,        href: '#' },
              { icon: Linkedin,       href: '#' },
              { icon: MessageCircle,  href: '#' },
              { icon: Mail,           href: '#' },
            ].map(({ icon: Icon, href }, i) => (
              <a key={i} href={href} className="lp-social-icon"><Icon size={14} /></a>
            ))}
          </div>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className="lp-header">
        <div className="lp-header-inner">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-m">D</span>
            <span className="lp-logo-rest">ocVault</span>
          </Link>
          <div className="lp-ad-banner">
            CLICKABLE SPONSOR AD SLOT (728×90) — LAZY LOADED
          </div>
        </div>
      </header>

      {/* ── CATEGORY NAV ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <button className="lp-hamburger" onClick={() => setMenuOpen(m => !m)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <ul className={`lp-nav-list ${menuOpen ? 'open' : ''}`}>
            {CATEGORIES.map(cat => (
              <li key={cat} className="lp-nav-item">
                <a href="#" className="lp-nav-link">
                  {cat} <ChevronDown size={12} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── SEARCH BAR ── */}
      <div className="lp-search-bar">
        <div className="lp-search-inner">
          <div className="lp-search-wrap">
            <input
              type="text"
              className="lp-search-input"
              placeholder="Enter your search topic here and click ENTER/LENS…"
            />
            <button className="lp-search-btn"><Search size={18} /></button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="lp-main">
        <div className="lp-content-wrap">

          {/* LEFT: articles */}
          <div className="lp-articles">

            {/* Section heading */}
            <div className="lp-section-heading">
              <span className="lp-section-icon"><BookOpen size={16} /></span>
              <h2>Architecture / Construction NEWS</h2>
            </div>

            {/* Featured 3-col grid */}
            <div className="lp-featured-grid">
              {FEATURED_DOCS.map(doc => (
                <article key={doc.id} className="lp-card">
                  <div className="lp-card-img-wrap">
                    <img src={doc.img} alt={doc.title} className="lp-card-img" loading="lazy" />
                    <span className="lp-card-cat">{doc.category}</span>
                  </div>
                  <div className="lp-card-body">
                    <h3 className="lp-card-title">{doc.title}</h3>
                    <p className="lp-card-excerpt">{doc.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Second row grid */}
            <div className="lp-featured-grid lp-mt">
              {GRID_DOCS.map(doc => (
                <article key={doc.id} className="lp-card">
                  <div className="lp-card-img-wrap">
                    <img src={doc.img} alt={doc.title} className="lp-card-img" loading="lazy" />
                    <span className="lp-card-cat">{doc.category}</span>
                  </div>
                  <div className="lp-card-body">
                    <h3 className="lp-card-title">{doc.title}</h3>
                    <p className="lp-card-date">{doc.date}</p>
                  </div>
                </article>
              ))}
            </div>

            {/* Yellow sections */}
            <div className="lp-yellow-row">
              <div className="lp-yellow-links">
                {YELLOW_SECTIONS.map(s => (
                  <a key={s} href="#" className="lp-yellow-link">{s}</a>
                ))}
              </div>
              <div className="lp-yellow-note">
                These features have look &amp; feel as well as design &amp; appearance (in all aspects)
                in the same manner as the ARCHITECTURE/CONSTRUCTION NEWS feature displayed above
              </div>
            </div>

            {/* Newsletter */}
            <div className="lp-newsletter">
              <div className="lp-newsletter-text">
                <h3>Join us Now &amp; Stay Updated!</h3>
                <p>Stay updated on what matters most in residential architecture, delivered straight to your email inbox.</p>
              </div>
              <div className="lp-newsletter-form">
                <input
                  type="email"
                  className="lp-nl-input"
                  placeholder="Enter your email ID…"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <button className="lp-nl-btn">Subscribe</button>
              </div>
            </div>

          </div>

          {/* RIGHT: sidebar */}
          <aside className="lp-sidebar">
            {SIDEBAR_NEWS.map(item => (
              <a key={item.id} href="#" className="lp-sidebar-item">
                <img src={item.img} alt={item.title} className="lp-sidebar-img" loading="lazy" />
                <div className="lp-sidebar-text">
                  <p className="lp-sidebar-title">{item.title}</p>
                  <span className="lp-sidebar-date">{item.date}</span>
                </div>
              </a>
            ))}
            <a href="#" className="lp-view-all">View All News <ArrowRight size={14} /></a>

            {/* Sidebar ad slots */}
            <div className="lp-sidebar-ad">CLICKABLE SPONSOR AD SLOT (728×90)</div>
            <div className="lp-sidebar-ad">CLICKABLE SPONSOR AD SLOT (728×90)</div>
            <div className="lp-sidebar-ad">CLICKABLE SPONSOR AD SLOT (728×90)</div>
          </aside>

        </div>

        {/* Bottom ad */}
        <div className="lp-bottom-ad">CLICKABLE SPONSOR AD SLOT (728×90)</div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">

          <div className="lp-footer-brand">
            <Link to="/" className="lp-footer-logo">
              <span className="lp-logo-m">D</span>
              <span className="lp-logo-rest">ocVault</span>
            </Link>
            <div className="lp-footer-social">
              {[Facebook, Instagram, Youtube, Twitter, Linkedin, MessageCircle, Mail].map((Icon, i) => (
                <a key={i} href="#" className="lp-footer-social-icon"><Icon size={14} /></a>
              ))}
            </div>
            <p className="lp-footer-tagline">Everything About Residential Architecture &amp; Construction !!!</p>
          </div>

          <div className="lp-footer-col">
            <h4>Quick Links</h4>
            <a href="#">About Us</a>
            <a href="#">Careers</a>
            <a href="#">Advertise</a>
            <a href="#">Contact Us</a>
          </div>

          <div className="lp-footer-col">
            <h4>Legal</h4>
            <a href="#">Terms &amp; Conditions</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Disclaimer</a>
            <a href="#">Sitemap</a>
          </div>

          <div className="lp-footer-col lp-footer-nl">
            <h4>Newsletter</h4>
            <p>Subscribe for periodic updates and alerts.</p>
            <input type="email" placeholder="Your Email ID" className="lp-footer-nl-input" />
            <button className="lp-footer-nl-btn">Subscribe</button>
          </div>

        </div>
        <div className="lp-footer-bottom">
          ©2026 — All Rights Reserved by DocVault
        </div>
      </footer>

    </div>
  )
}
