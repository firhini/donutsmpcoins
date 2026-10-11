import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '../../lib/api';
import { adminLogin, errorMessage } from '../../lib/adminApi';
import { Icon } from '../ui/Icons';
import { Checkbox, Field } from './Field';

function EyeOff({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a18 18 0 0 1 5.1-5.9m3.8-1.8A10 10 0 0 1 12 5c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22" />
    </svg>
  );
}

export function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminLogin(password, remember);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) setError('Wrong password.');
      else if (err instanceof ApiClientError && err.status === 503) setError('Admin is not configured yet – set ADMIN_PASSWORD in your Netlify environment variables.');
      else setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form className="card adm-login-card" onSubmit={submit}>
        <div className="adm-login-logo">
          <img src="/img/brand/logo.svg" alt="" width={44} height={44} />
          <div>
            <strong>
              Donut<span className="pink-text">Coins</span>
            </strong>
            <div className="eyebrow">Admin</div>
          </div>
        </div>
        <div>
          <h1>Welcome back</h1>
          <p className="muted small" style={{ marginTop: 6 }}>
            Sign in with the admin password you set in Netlify.
          </p>
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            <Icon name="warning" size={16} /> <span>{error}</span>
          </div>
        )}
        <Field label="Password" htmlFor="adm-password">
          <div className="adm-pw">
            <input
              id="adm-password"
              className="input"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
            />
            <button type="button" className="btn btn-ghost btn-icon" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
              {show ? <EyeOff /> : <Icon name="eye" size={18} />}
            </button>
          </div>
        </Field>
        <Checkbox checked={remember} onChange={setRemember} label="Keep me signed in on this device (7 days)" />
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!password || busy}>
          {busy ? <span className="spinner" /> : <Icon name="lock" size={16} />}
          Sign in
        </button>
        <div className="adm-login-foot">
          <Link to="/" className="row" style={{ gap: 4 }}>
            <Icon name="arrowRight" size={12} style={{ transform: 'rotate(180deg)' }} /> Back to store
          </Link>
          <span>Password = env var ADMIN_PASSWORD</span>
        </div>
      </form>
    </div>
  );
}
