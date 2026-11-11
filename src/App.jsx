
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation
} from 'react-router-dom';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  FileImage,
  Filter,
  HardHat,
  ImagePlus,
  LayoutDashboard,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Wrench,
  X
} from 'lucide-react';

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer
} from 'react-leaflet';

import { isSupabaseConfigured, supabase } from './lib/supabase';

const demoReports = [
  {
    id: 'RW-1001',
    title: 'Large pothole near the intersection',
    type: 'Pothole',
    description: 'A deep pothole is causing vehicles to swerve, especially motorcycles.',
    location: 'National Highway, Barangay Real',
    latitude: 14.2118,
    longitude: 121.1653,
    status: 'Verified',
    priority: 'High',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    photo_url: '',
    reporter: 'Maria S.'
  },
  {
    id: 'RW-1002',
    title: 'Streetlight not working',
    type: 'Broken streetlight',
    description: 'The streetlight has been off for several nights.',
    location: 'Rizal Street, Barangay Uno',
    latitude: 14.2182,
    longitude: 121.1587,
    status: 'In Progress',
    priority: 'Medium',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    photo_url: '',
    reporter: 'John D.'
  },
  {
    id: 'RW-1003',
    title: 'Damaged sidewalk tiles',
    type: 'Damaged sidewalk',
    description: 'Several tiles are loose and may cause pedestrians to trip.',
    location: 'Near public market',
    latitude: 14.2057,
    longitude: 121.1720,
    status: 'Submitted',
    priority: 'Low',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    photo_url: '',
    reporter: 'Ana R.'
  },
  {
    id: 'RW-1004',
    title: 'Road partially blocked by debris',
    type: 'Blocked road',
    description: 'Construction debris is blocking one lane.',
    location: 'Purok 3, Barangay San Isidro',
    latitude: 14.2250,
    longitude: 121.1800,
    status: 'Resolved',
    priority: 'Medium',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(),
    photo_url: '',
    reporter: 'Carlo M.'
  }
];

const statuses = [
  'Submitted',
  'Under Review',
  'Verified',
  'Assigned for Repair',
  'In Progress',
  'Resolved',
  'Rejected'
];

const statusClass = status =>
  status.toLowerCase().replaceAll(' ', '-');

const dateText = date =>
  new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  const [reports, setReports] = useState(demoReports);
  const [toast, setToast] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);

  const notify = message => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let active = true;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (active && !error) {
        setReports(data || []);
        setLive(true);
      }

      if (active && error) {
        notify('Could not load cloud reports. Check your Supabase setup.');
      }

      if (active) {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel('sumbong-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        load
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const addReport = async form => {
    const record = {
      ...form,
      id: `RW-${Date.now().toString().slice(-6)}`,
      status: 'Submitted',
      priority: 'Unassigned',
      created_at: new Date().toISOString(),
      reporter: 'Community member'
    };

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reports')
        .insert([{ ...record }])
        .select()
        .single();

      if (error) throw error;

      setReports(previous => [data, ...previous]);
    } else {
      setReports(previous => [record, ...previous]);
    }

    notify('Your report has been submitted successfully.');
    return record.id;
  };

  const updateReport = async (id, changes) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('reports')
        .update(changes)
        .eq('id', id);

      if (error) {
        notify(error.message);
        return;
      }
    }

    setReports(previous =>
      previous.map(report =>
        report.id === id
          ? { ...report, ...changes }
          : report
      )
    );

    notify('Report updated successfully.');
  };

  const deleteReport = async id => {
    if (!window.confirm('Delete this report? This cannot be undone.')) {
      return;
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (error) {
        notify(error.message);
        return;
      }
    }

    setReports(previous =>
      previous.filter(report => report.id !== id)
    );

    notify('Report deleted.');
  };

  return (
    <div className="app-shell">

      {!isAdminRoute && (
        <header className="topbar">

          <Link to="/" className="brand">
            <span className="brand-mark">
              <HardHat size={21} />
            </span>

            <span>
              SUMBONG
              <small>COMMUNITY REPORTING SYSTEM</small>
            </span>
          </Link>

          <button
            className="mobile-toggle icon-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            <Menu />
          </button>

          <nav className={mobileMenu ? 'nav open' : 'nav'}>
            <NavLink
              to="/"
              end
              onClick={() => setMobileMenu(false)}
            >
              Report an issue
            </NavLink>

            <NavLink
              to="/track"
              onClick={() => setMobileMenu(false)}
            >
              Track report
            </NavLink>

            <NavLink
              to="/admin"
              onClick={() => setMobileMenu(false)}
            >
              Admin portal
            </NavLink>
          </nav>

          <div className="top-actions">
            <span className={live ? 'connection live' : 'connection'}>
              <i />
              {live ? 'Cloud connected' : 'Demo mode'}
            </span>
          </div>

        </header>
      )}

      {!isSupabaseConfigured && !isAdminRoute && (
        <div className="demo-banner">
          <AlertTriangle size={15} />
          You're viewing demo mode. Connect Supabase to save reports across devices.
          <a
            href="#setup"
            onClick={() =>
              document.getElementById('setup')?.scrollIntoView({
                behavior: 'smooth'
              })
            }
          >
            Setup guide
          </a>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <ReportPage
              onSubmit={addReport}
              reports={reports}
            />
          }
        />

        <Route
          path="/track"
          element={<TrackPage reports={reports} />}
        />

        <Route
          path="/admin"
          element={
            <AdminPage
              reports={reports}
              onUpdate={updateReport}
              onDelete={deleteReport}
              loading={loading}
            />
          }
        />

        <Route
          path="*"
          element={
            <ReportPage
              onSubmit={addReport}
              reports={reports}
            />
          }
        />
      </Routes>

      {!isAdminRoute && (
        <footer className="footer">
          <div className="footer-brand">
            <span className="brand-mark">
              <HardHat size={18} />
            </span>
            <strong>SUMBONG</strong>
          </div>

          <span>Community Reporting and Monitoring System</span>
          <span>© 2026 SUMBONG</span>
        </footer>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}

    </div>
  );
}

/* CITIZEN REPORTING PAGE */

function ReportPage({ onSubmit, reports }) {
  const [form, setForm] = useState({
    title: '',
    type: 'Pothole',
    description: '',
    location: '',
    latitude: null,
    longitude: null
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  const set = (key, value) => {
    setForm(previous => ({
      ...previous,
      [key]: value
    }));
  };

  const locate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setForm(previous => ({
          ...previous,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
      },
      () => {
        alert('Unable to get your location. Please allow location access.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000
      }
    );
  };

  const pick = event => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Please choose an image smaller than 5 MB.');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);

    try {
      let photo_url = '';

      if (file && isSupabaseConfigured) {
        const path = `${Date.now()}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          '_'
        )}`;

        const { error } = await supabase.storage
          .from('report-photos')
          .upload(path, file, {
            upsert: false
          });

        if (error) throw error;

        photo_url = supabase.storage
          .from('report-photos')
          .getPublicUrl(path)
          .data.publicUrl;
      } else if (preview) {
        photo_url = preview;
      }

      const id = await onSubmit({
        ...form,
        photo_url
      });

      setSuccess(id);

      setForm({
        title: '',
        type: 'Pothole',
        description: '',
        location: '',
        latitude: null,
        longitude: null
      });

      setFile(null);
      setPreview('');
    } catch (error) {
      alert(error.message || 'Unable to submit report.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main>

      <section className="citizen-intro">
        <div className="citizen-intro-content">
          <div className="eyebrow dark">
            MUNICIPAL COMMUNITY REPORTING
          </div>

          <h1>Report a Community Concern</h1>

          <p>
            Help improve road safety in your community. Submit reports
            about potholes, damaged sidewalks, broken streetlights,
            flooding, and other road-related concerns.
          </p>
        </div>
      </section>

      <section className="content-grid">

        <div className="form-panel">

          <div className="section-heading">
            <div>
              <div className="eyebrow dark">SUBMIT A REPORT</div>
              <h2>Report Details</h2>
              <p>
                Provide accurate information so the administration
                can review your concern.
              </p>
            </div>

            <span className="step-pill">REPORT FORM</span>
          </div>

          {success && (
            <div className="success-box">
              <CheckCircle2 size={22} />

              <div>
                <b>Report submitted successfully!</b>

                <p>
                  Your reference number is <strong>{success}</strong>.
                  Save it to track your report.
                </p>

                <Link to="/track">
                  Track your report <ArrowRight size={14} />
                </Link>
              </div>

              <button
                className="icon-btn"
                onClick={() => setSuccess('')}
              >
                <X size={17} />
              </button>
            </div>
          )}

          <form onSubmit={submit} className="report-form">

            <label>
              Issue title <span>*</span>

              <input
                required
                maxLength="100"
                value={form.title}
                onChange={event => set('title', event.target.value)}
                placeholder="e.g. Large pothole near the school"
              />
            </label>

            <div className="field-row">

              <label>
                Type of damage <span>*</span>

                <div className="select-wrap">
                  <select
                    value={form.type}
                    onChange={event => set('type', event.target.value)}
                  >
                    <option>Pothole</option>
                    <option>Broken streetlight</option>
                    <option>Damaged sidewalk</option>
                    <option>Blocked road</option>
                    <option>Flooding</option>
                    <option>Other</option>
                  </select>

                  <ChevronDown size={16} />
                </div>
              </label>

              <label>
                Location / landmark <span>*</span>

                <input
                  required
                  value={form.location}
                  onChange={event => set('location', event.target.value)}
                  placeholder="Street, barangay, nearby landmark"
                />
              </label>

            </div>

            <label>
              Description <span>*</span>

              <textarea
                required
                rows="4"
                maxLength="1000"
                value={form.description}
                onChange={event => set('description', event.target.value)}
                placeholder="Describe the issue and how it affects people..."
              />
            </label>

            <div className="label-row">
              <label>
                Photo evidence <small>(Optional, max 5 MB)</small>
              </label>

              <span className="optional">OPTIONAL</span>
            </div>

            <label className="upload-zone">

              {preview ? (
                <img
                  src={preview}
                  alt="Selected evidence"
                  className="upload-preview"
                />
              ) : (
                <>
                  <span className="upload-icon">
                    <ImagePlus size={23} />
                  </span>

                  <b>Click to upload a photo</b>
                  <small>JPG, PNG or WEBP · Up to 5 MB</small>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={pick}
                hidden
              />

              {preview && (
                <span className="change-photo">Change photo</span>
              )}

            </label>

            <div className="location-box">

              <div className="location-icon">
                <LocateFixed size={19} />
              </div>

              <div className="location-copy">
                <b>GPS Location</b>

                <small>
                  {form.latitude
                    ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                    : 'Attach your current GPS coordinates to the report.'}
                </small>
              </div>

              <button
                type="button"
                className="outline-btn"
                onClick={locate}
              >
                <MapPin size={15} />
                {form.latitude ? 'Update GPS' : 'Use my location'}
              </button>

            </div>

            <button
              disabled={busy}
              className="submit-btn"
              type="submit"
            >
              {busy ? 'Submitting...' : 'Submit Report'}
              <ArrowRight size={17} />
            </button>

            <p className="privacy-note">
              <ShieldCheck size={14} />
              Your report helps local administrators identify
              and address road safety issues.
            </p>

          </form>
        </div>

        <aside className="side-column">

          <div className="info-card">
            <div className="info-icon">
              <Smartphone size={20} />
            </div>

            <h3>How to Submit a Report</h3>

            <div className="how-step">
              <span>1</span>
              <div>
                <b>Identify an issue</b>
                <p>Notice a road problem in your neighborhood?</p>
              </div>
            </div>

            <div className="how-step">
              <span>2</span>
              <div>
                <b>Submit the details</b>
                <p>Describe the issue and attach photo evidence.</p>
              </div>
            </div>

            <div className="how-step">
              <span>3</span>
              <div>
                <b>Administrative review</b>
                <p>Administrators review and coordinate necessary action.</p>
              </div>
            </div>

            <div className="how-step">
              <span>4</span>
              <div>
                <b>Track your report</b>
                <p>Use your reference number to check its progress.</p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-top">
              <span>COMMUNITY REPORTS</span>
              <ClipboardList size={18} />
            </div>

            <strong>{reports.length.toString().padStart(2, '0')}</strong>

            <p>Reports submitted so far</p>

            <div className="stats-bottom">
              <span>
                <i className="dot-green" />
                {reports.filter(r => r.status === 'Resolved').length} resolved
              </span>

              <span>
                <i className="dot-orange" />
                {reports.filter(r => r.status !== 'Resolved').length} active
              </span>
            </div>
          </div>

          <div className="help-card">
            <b>Emergency Notice</b>

            <p>
              For immediate danger or life-threatening situations,
              contact your local emergency services directly.
            </p>
          </div>

        </aside>

      </section>

      <section className="recent-strip">
        <div>
          <div className="eyebrow dark">COMMUNITY ACTION</div>
          <h2>Help improve your community.</h2>
        </div>

        <Link to="/track" className="text-link">
          Track a submitted report <ArrowRight size={16} />
        </Link>
      </section>

      <SetupGuide />

    </main>
  );
}

/* REPORT TRACKING PAGE */

function TrackPage({ reports }) {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);

  const results = useMemo(
    () =>
      reports.filter(
        report =>
          report.id.toLowerCase() === query.trim().toLowerCase()
      ),
    [reports, query]
  );

  return (
    <main className="inner-page">

      <div className="page-intro">
        <div className="eyebrow dark">REPORT STATUS</div>

        <h1>Track Your Report</h1>

        <p>
          Enter the reference number you received after submitting your report.
        </p>
      </div>

      <div className="track-search">
        <Search size={20} />

        <input
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setSearched(false);
          }}
          onKeyDown={event =>
            event.key === 'Enter' && setSearched(true)
          }
          placeholder="e.g. RW-1001"
        />

        <button onClick={() => setSearched(true)}>
          Find Report <ArrowRight size={16} />
        </button>
      </div>

      {searched && (
        <div className="track-results">
          {results.length ? (
            results.map(report => (
              <ReportCard
                key={report.id}
                report={report}
              />
            ))
          ) : (
            <div className="empty-state">
              <Search size={28} />
              <b>No report found</b>
              <p>Check your reference number and try again.</p>
            </div>
          )}
        </div>
      )}

      <div className="track-tip">
        <ShieldCheck size={18} />

        <span>
          <b>Keep your reference number safe.</b>
          <br />
          Only the exact reference number will show a report in this demo.
          A live deployment should add citizen authentication or a secure
          tracking token.
        </span>
      </div>

    </main>
  );
}

function ReportCard({ report }) {
  return (
    <article className="track-card">

      <div className="track-card-top">
        <span className="report-id">{report.id}</span>
        <Status status={report.status} />
      </div>

      <h3>{report.title}</h3>
      <p>{report.description}</p>

      <div className="track-meta">
        <span>
          <MapPin size={14} />
          {report.location}
        </span>

        <span>
          <Clock3 size={14} />
          {dateText(report.created_at)}
        </span>
      </div>

      {report.photo_url && (
        <img
          className="track-photo"
          src={report.photo_url}
          alt="Reported road damage"
        />
      )}

    </article>
  );
}

function Status({ status }) {
  return (
    <span className={`status status-${statusClass(status)}`}>
      {status}
    </span>
  );
}

/* ADMIN DASHBOARD */

function AdminPage({ reports, onUpdate, onDelete, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const filtered = reports.filter(report =>
    (filter === 'All' || report.status === filter) &&
    `${report.id} ${report.title} ${report.location} ${report.type}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const counts = {
    total: reports.length,

    active: reports.filter(report =>
      !['Resolved', 'Rejected'].includes(report.status)
    ).length,

    progress: reports.filter(report =>
      ['In Progress', 'Assigned for Repair'].includes(report.status)
    ).length,

    resolved: reports.filter(report =>
      report.status === 'Resolved'
    ).length
  };

  return (
    <main className="admin-layout">

      <aside className="admin-sidebar">

        <div className="sidebar-brand">
          <span className="sidebar-logo">
            <HardHat size={23} />
          </span>

          <div>
            <strong>SUMBONG</strong>
            <small>ADMINISTRATION</small>
          </div>
        </div>

        <div className="sidebar-section-label">
          MAIN MENU
        </div>

        <nav className="sidebar-nav">

          <a href="#dashboard" className="sidebar-link active">
            <LayoutDashboard size={18} />
            Dashboard
          </a>

          <a href="#complaints" className="sidebar-link">
            <ClipboardList size={18} />
            Complaints
          </a>

          <a href="#locations" className="sidebar-link">
            <MapPin size={18} />
            Reported Locations
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="sidebar-user">
            <div className="admin-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <small>Municipal Office</small>
            </div>
          </div>

          <Link to="/" className="sidebar-logout">
            <LogOut size={17} />
            Citizen Portal
          </Link>

        </div>

      </aside>

      <div className="admin-main">

        <header className="admin-topbar">

          <div>
            <span className="admin-breadcrumb">
              ADMINISTRATION / DASHBOARD
            </span>

            <h2>Management Dashboard</h2>
          </div>

          <div className="admin-topbar-right">

            <span className={liveConnectionClass()}>
              <i />
              {isSupabaseConfigured ? 'Cloud connected' : 'Demo mode'}
            </span>

            <span className="admin-date">
              <Clock3 size={15} />

              {new Date().toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>

          </div>

        </header>

        <section
          id="dashboard"
          className="admin-dashboard-content"
        >

          <div className="admin-heading">

            <div>
              <h1>Dashboard Overview</h1>
              <p>
                Monitor, review, and manage community road reports.
              </p>
            </div>

            <button
              className="primary-small"
              onClick={() => window.print()}
            >
              Export / Print <ArrowRight size={15} />
            </button>

          </div>

          <div className="metric-grid">

            <Metric
              icon={<ClipboardList />}
              label="Total reports"
              value={counts.total}
              note="All submitted reports"
            />

            <Metric
              icon={<AlertTriangle />}
              label="Needs attention"
              value={counts.active}
              note="Awaiting resolution"
            />

            <Metric
              icon={<Wrench />}
              label="Being repaired"
              value={counts.progress}
              note="Assigned or in progress"
            />

            <Metric
              icon={<CheckCircle2 />}
              label="Resolved"
              value={counts.resolved}
              note="Successfully addressed"
            />

          </div>

          <div className="admin-content">

            <section
              id="complaints"
              className="reports-panel"
            >

              <div className="panel-heading">

                <div>
                  <h2>Complaint Records</h2>
                  <p>
                    Review citizen submissions and update their progress.
                  </p>
                </div>

                <span className="total-tag">
                  {filtered.length} reports
                </span>

              </div>

              <div className="toolbar">

                <div className="admin-search">
                  <Search size={17} />

                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search reports..."
                  />
                </div>

                <div className="filter-wrap">
                  <Filter size={15} />

                  <select
                    value={filter}
                    onChange={event => setFilter(event.target.value)}
                  >
                    <option>All</option>

                    {statuses.map(status => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>

                  <ChevronDown size={14} />
                </div>

              </div>

              <div className="table-wrap">

                <table>
                  <thead>
                    <tr>
                      <th>REPORT</th>
                      <th>LOCATION</th>
                      <th>DATE SUBMITTED</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map(report => (
                      <tr key={report.id}>

                        <td>
                          <div className="report-cell">

                            <span className="report-type-icon">
                              <AlertTriangle size={17} />
                            </span>

                            <span>
                              <b>{report.title}</b>
                              <small>
                                {report.id} · {report.type}
                              </small>
                            </span>

                          </div>
                        </td>

                        <td className="location-cell">
                          {report.location}
                        </td>

                        <td className="date-cell">
                          {dateText(report.created_at)}
                        </td>

                        <td>
                          <Status status={report.status} />
                        </td>

                        <td>
                          <button
                            className="view-btn"
                            onClick={() => setSelected(report)}
                          >
                            View Details <ArrowRight size={13} />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>

                {!filtered.length && (
                  <div className="empty-state">
                    <ClipboardList size={27} />

                    <b>
                      {loading ? 'Loading reports...' : 'No reports found'}
                    </b>

                    <p>
                      Try changing your search or filter.
                    </p>
                  </div>
                )}

              </div>

            </section>

            <aside className="admin-side">

              <div id="locations">
                <MapPanel reports={reports} />
              </div>

              <div className="side-panel">

                <div className="panel-heading">
                  <div>
                    <h3>Reports by Status</h3>
                    <p>Current workload breakdown</p>
                  </div>
                </div>

                {statuses.slice(0, 6).map(status => {
                  const count = reports.filter(
                    report => report.status === status
                  ).length;

                  const percentage = reports.length
                    ? (count / reports.length) * 100
                    : 0;

                  return (
                    <div className="status-bar-row" key={status}>

                      <div>
                        <span>{status}</span>
                        <b>{count}</b>
                      </div>

                      <div className="bar-track">
                        <i style={{ width: `${percentage}%` }} />
                      </div>

                    </div>
                  );
                })}

              </div>

              <div className="admin-note">
                <ShieldCheck size={20} />

                <div>
                  <b>Administrator Reminder</b>

                  <p>
                    Verify report details and location before assigning
                    repair work. Keep status updates accurate for citizens.
                  </p>
                </div>
              </div>

            </aside>

          </div>

        </section>

        {selected && (
          <div
            className="modal-backdrop"
            onClick={() => setSelected(null)}
          >

            <div
              className="detail-modal"
              onClick={event => event.stopPropagation()}
            >

              <div className="modal-head">

                <div>
                  <span className="report-id">
                    {selected.id}
                  </span>

                  <h2>Report Details</h2>
                </div>

                <button
                  className="icon-btn"
                  onClick={() => setSelected(null)}
                >
                  <X />
                </button>

              </div>

              <div className="modal-body">

                {selected.photo_url ? (
                  <img
                    src={selected.photo_url}
                    className="detail-photo"
                    alt="Road damage evidence"
                  />
                ) : (
                  <div className="no-photo">
                    <FileImage size={25} />
                    No photo evidence attached
                  </div>
                )}

                <h3>{selected.title}</h3>
                <p>{selected.description}</p>

                <div className="detail-info">

                  <span>
                    <MapPin size={15} />
                    {selected.location}
                  </span>

                  <span>
                    <Clock3 size={15} />
                    {dateText(selected.created_at)}
                  </span>

                  <span>
                    <AlertTriangle size={15} />
                    {selected.type}
                  </span>

                </div>

                {selected.latitude && selected.longitude && (
                  <a
                    className="map-link"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`}
                  >
                    <MapPin size={15} />
                    Open reported coordinates on map
                    <ArrowRight size={14} />
                  </a>
                )}

                <label className="status-edit">
                  Update Report Status

                  <select
                    value={selected.status}
                    onChange={event => {
                      const status = event.target.value;

                      onUpdate(selected.id, { status });

                      setSelected({
                        ...selected,
                        status
                      });
                    }}
                  >
                    {statuses.map(status => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="status-edit">
                  Assign to / Repair Team

                  <input
                    defaultValue={selected.assigned_to || ''}
                    placeholder="e.g. Road Maintenance Team A"
                    onBlur={event => {
                      if (
                        event.target.value !==
                        (selected.assigned_to || '')
                      ) {
                        onUpdate(selected.id, {
                          assigned_to: event.target.value
                        });

                        setSelected({
                          ...selected,
                          assigned_to: event.target.value
                        });
                      }
                    }}
                  />
                </label>

                <button
                  className="delete-btn"
                  onClick={() => {
                    onDelete(selected.id);
                    setSelected(null);
                  }}
                >
                  <Trash2 size={15} />
                  Delete Report
                </button>

              </div>

            </div>

          </div>
        )}

      </div>

    </main>
  );
}

function liveConnectionClass() {
  return isSupabaseConfigured
    ? 'connection live'
    : 'connection';
}

/* MAP */

function MapPanel({ reports }) {
  const located = reports.filter(report =>
    Number.isFinite(Number(report.latitude)) &&
    Number.isFinite(Number(report.longitude))
  );

  return (
    <div className="side-panel map-panel">

      <div className="panel-heading">
        <div>
          <h3>Reported Locations</h3>
          <p>{located.length} reports with GPS coordinates</p>
        </div>
      </div>

      <MapContainer
        center={[12.8797, 121.7740]}
        zoom={6}
        scrollWheelZoom={false}
        className="admin-map"
      >

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {located.map(report => (
          <Marker
            key={report.id}
            position={[
              Number(report.latitude),
              Number(report.longitude)
            ]}
          >
            <Popup>
              <strong>{report.title}</strong>
              <br />
              {report.location}
              <br />
              Status: {report.status}
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {!located.length && (
        <p className="map-empty">
          No GPS-tagged reports yet. Reports with location coordinates
          will appear here.
        </p>
      )}

    </div>
  );
}

/* DASHBOARD COMPONENTS */

function Metric({ icon, label, value, note }) {
  return (
    <div className="metric-card">

      <div className="metric-top">
        <span>{label}</span>
        <i>{icon}</i>
      </div>

      <strong>{value.toString().padStart(2, '0')}</strong>

      <small>{note}</small>

    </div>
  );
}

/* SUPABASE SETUP GUIDE */

function SetupGuide() {
  return (
    <section id="setup" className="setup-guide">

      <div className="eyebrow dark">
        FOR DEVELOPERS
      </div>

      <h2>Connect Your Database</h2>

      <p>
        SUMBONG uses Supabase to store community reports, photo evidence,
        and live report updates. Follow your database setup guide to
        configure the system.
      </p>

      <a
        href="https://supabase.com/dashboard"
        target="_blank"
        rel="noreferrer"
        className="text-link"
      >
        Open Supabase Dashboard <ArrowRight size={15} />
      </a>

    </section>
  );
}

export default App;
