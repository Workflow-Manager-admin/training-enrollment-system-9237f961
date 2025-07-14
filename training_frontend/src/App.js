import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * Color palette (from spec):
 *   --primary:   #1976d2 (blue, main buttons)
 *   --secondary: #424242 (dark gray, backgrounds)
 *   --accent:    #ffb300 (amber, highlights)
 */

// Backend API configuration (update BASE_URL if needed)
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * Enrollment Form Component
 */
function EnrollmentForm({ onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    team: "",
    trainingSession: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sessionOptions = [
    "Effective Communication",
    "Time Management",
    "Project Leadership",
    "Diversity & Inclusion"
  ];

  // Validate the form fields
  const validate = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = "Name is required";
    }
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)
    ) {
      errors.email = "Invalid email address";
    }
    if (!form.team.trim()) {
      errors.team = "Team is required";
    }
    if (!form.trainingSession) {
      errors.trainingSession = "Please select a session";
    }
    return errors;
  };

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(e => ({ ...e, [e.target.name]: undefined }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`${BASE_URL}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        onSuccess(form.email); // Pass submitted email forward for status
      } else {
        const data = await response.json().catch(() => ({}));
        setErrors({ api: data.detail || "Submission failed. Try again." });
      }
    } catch (err) {
      setErrors({ api: "Network error. Please try later." });
    }
    setIsSubmitting(false);
  };

  return (
    <form className="enrollment-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">Team Training Enrollment</h2>
      <div className="form-group">
        <label>Name<span className="required">*</span></label>
        <input
          autoComplete="off"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name && "name-error"}
        />
        {errors.name && <div className="error" id="name-error">{errors.name}</div>}
      </div>
      <div className="form-group">
        <label>Email<span className="required">*</span></label>
        <input
          autoComplete="off"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email && "email-error"}
        />
        {errors.email && <div className="error" id="email-error">{errors.email}</div>}
      </div>
      <div className="form-group">
        <label>Team<span className="required">*</span></label>
        <input
          autoComplete="off"
          type="text"
          name="team"
          value={form.team}
          onChange={handleChange}
          aria-invalid={!!errors.team}
          aria-describedby={errors.team && "team-error"}
        />
        {errors.team && <div className="error" id="team-error">{errors.team}</div>}
      </div>
      <div className="form-group">
        <label>Training Session<span className="required">*</span></label>
        <select
          name="trainingSession"
          value={form.trainingSession}
          onChange={handleChange}
          aria-invalid={!!errors.trainingSession}
          aria-describedby={errors.trainingSession && "session-error"}
        >
          <option value="">-- Select a session --</option>
          {sessionOptions.map(option =>
            <option key={option} value={option}>{option}</option>
          )}
        </select>
        {errors.trainingSession && (
          <div className="error" id="session-error">{errors.trainingSession}</div>
        )}
      </div>
      <button className="btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Enroll"}
      </button>
      {errors.api && <div className="error api-error">{errors.api}</div>}
      <div className="form-note">* Required fields</div>
    </form>
  );
}

/**
 * Confirmation View
 */
function Confirmation({ email, onViewStatus, onNew }) {
  return (
    <div className="confirmation-view">
      <h2>Submission Successful!</h2>
      <p>
        Thank you for enrolling. A confirmation has been sent to <span className="accent">{email}</span>.
      </p>
      <div className="confirmation-actions">
        <button className="btn-accent" onClick={() => onViewStatus(email)}>View My Status</button>
        <button className="btn-secondary" onClick={onNew}>Submit Another Enrollment</button>
      </div>
    </div>
  );
}

/**
 * Status View (show status after entering email)
 */
function StatusView({ email, onBack }) {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function fetchStatus() {
      setLoading(true);
      setErr(null);
      try {
        const resp = await fetch(`${BASE_URL}/status/${encodeURIComponent(email)}`);
        if (!resp.ok) {
          setErr("Status not found for this email.");
        } else {
          const data = await resp.json();
          if (!ignore) setStatus(data);
        }
      } catch {
        setErr("Failed to contact server.");
      }
      setLoading(false);
    }
    fetchStatus();
    return () => { ignore = true; };
    // eslint-disable-next-line
  }, [email]);

  return (
    <div className="status-view">
      <h2>Enrollment Status</h2>
      <div className="status-box">
        {loading && <span>Loading...</span>}
        {err && <span className="error">{err}</span>}
        {status && (
          <ul className="status-list">
            <li><strong>Name:</strong> {status.name}</li>
            <li><strong>Email:</strong> {status.email}</li>
            <li><strong>Team:</strong> {status.team}</li>
            <li><strong>Session:</strong> {status.trainingSession}</li>
            <li><strong>Status:</strong> <span className="accent">{status.status || "Enrolled"}</span></li>
          </ul>
        )}
      </div>
      <button className="btn-secondary" onClick={onBack}>Back</button>
    </div>
  );
}

/**
 * Entry Point & Routing (SPA state switcher)
 */
// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('form'); // 'form' | 'confirmation' | 'status' | 'checkStatus'
  const [lastEmail, setLastEmail] = useState('');
  const [checkStatusEmail, setCheckStatusEmail] = useState('');
  const [checkError, setCheckError] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const handleSuccess = (email) => {
    setLastEmail(email);
    setView('confirmation');
  };

  const handleViewStatus = (email) => {
    setLastEmail(email);
    setView('status');
  };

  const handleCheckStatus = (e) => {
    e.preventDefault();
    setCheckError('');
    if (!checkStatusEmail.trim() ||
        !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(checkStatusEmail)) {
      setCheckError('Valid email required');
      return;
    }
    setLastEmail(checkStatusEmail.trim());
    setView('status');
  };

  // navbar, page layout, theme toggle
  return (
    <div className="App">
      <header className="App-header minimal">
        <h1 className="spa-title">Team Training Enrollment</h1>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="App-main">
        <div className="page-card">
          {view === 'form' && (
            <>
              <EnrollmentForm
                onSuccess={handleSuccess}
              />
              <div className="status-prompt">
                <span>Already enrolled?</span>
                <button className="btn-link" onClick={() => setView('checkStatus')}>
                  Check your status
                </button>
              </div>
            </>
          )}
          {view === 'confirmation' && (
            <Confirmation
              email={lastEmail}
              onViewStatus={handleViewStatus}
              onNew={() => setView('form')}
            />
          )}
          {view === 'status' && (
            <StatusView
              email={lastEmail}
              onBack={() => setView('form')}
            />
          )}
          {view === 'checkStatus' && (
            <form className="check-status-form" onSubmit={handleCheckStatus}>
              <label>Enter your email to check enrollment:</label>
              <input
                type="email"
                value={checkStatusEmail}
                onChange={e => setCheckStatusEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="off"
              />
              {checkError && <div className="error">{checkError}</div>}
              <button className="btn-accent" type="submit">
                Check Status
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setView('form')}
                style={{ marginLeft: 8 }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </main>
      <footer className="App-footer">
        <span>&copy; {new Date().getFullYear()} Team Training Enrollment | Minimal SPA • Powered by React</span>
      </footer>
    </div>
  );
}

export default App;
