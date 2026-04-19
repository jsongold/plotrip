const styles = {
  shell: {
    width: '100%',
    maxWidth: 440,
    borderRadius: '24px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,250,0.98) 100%)',
    border: '1px solid rgba(212,212,212,0.9)',
    boxShadow: '0 28px 80px rgba(23,23,23,0.12)',
    overflow: 'hidden',
  },
  glow: {
    height: 112,
    background: 'radial-gradient(circle at top left, rgba(37,99,235,0.22), transparent 55%), radial-gradient(circle at top right, rgba(8,145,178,0.14), transparent 42%), linear-gradient(135deg, #f8fbff 0%, #f7f7f7 100%)',
  },
  body: {
    marginTop: -36,
    padding: '0 24px 24px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.92)',
    border: '1px solid rgba(212,212,212,0.92)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--accent)',
    boxShadow: '0 12px 28px rgba(23,23,23,0.08)',
  },
  title: {
    margin: '18px 0 8px',
    fontSize: 'clamp(26px, 4vw, 34px)',
    lineHeight: 1.02,
    letterSpacing: '-0.04em',
    fontWeight: 700,
    color: 'var(--text)',
  },
  description: {
    margin: 0,
    color: 'var(--text-muted)',
    fontSize: 'var(--font-base)',
    lineHeight: 1.6,
  },
  content: {
    marginTop: 22,
    display: 'grid',
    gap: 16,
  },
  footer: {
    marginTop: 18,
  },
};

export function AuthCard({
  eyebrow = 'Trip workspace',
  title = 'Sign in to save and revisit your trips',
  description = 'Use Google or email to access your travel workspace across devices.',
  children,
  footer,
}) {
  return (
    <section style={styles.shell}>
      <div style={styles.glow} />
      <div style={styles.body}>
        <div style={styles.badge}>
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 0 6px rgba(37,99,235,0.12)',
            }}
          />
          {eyebrow}
        </div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.description}>{description}</p>
        <div style={styles.content}>{children}</div>
        {footer ? <div style={styles.footer}>{footer}</div> : null}
      </div>
    </section>
  );
}

