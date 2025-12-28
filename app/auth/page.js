"use client";
import { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        router.push('/');
      } else {
        await signUp(email, password, name);
        setSuccess('Account erstellt! Bitte prüfe deine E-Mail zur Bestätigung.');
      }
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>💜</div>
        <h1 style={styles.title}>Amiya</h1>
        <p style={styles.subtitle}>
          {isLogin ? 'Willkommen zurück' : 'Account erstellen'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Dein Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            minLength={6}
            required
          />

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}

          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? '...' : isLogin ? 'Einloggen' : 'Registrieren'}
          </button>
        </form>

        <p style={styles.switch}>
          {isLogin ? 'Noch kein Account?' : 'Bereits registriert?'}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            style={styles.switchButton}
          >
            {isLogin ? 'Registrieren' : 'Einloggen'}
          </button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #fdf4ff 100%)',
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    padding: '40px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.1)',
    textAlign: 'center',
  },
  logo: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    borderRadius: '20px',
    margin: '0 auto 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  input: {
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '16px',
    background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    color: '#dc2626',
    fontSize: '14px',
    background: '#fef2f2',
    padding: '12px',
    borderRadius: '8px',
  },
  success: {
    color: '#16a34a',
    fontSize: '14px',
    background: '#f0fdf4',
    padding: '12px',
    borderRadius: '8px',
  },
  switch: {
    marginTop: '24px',
    color: '#6b7280',
    fontSize: '14px',
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#8b5cf6',
    fontWeight: '600',
    cursor: 'pointer',
    marginLeft: '8px',
  },
};
