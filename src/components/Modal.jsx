import { useState } from 'react';
import { Drawer } from 'vaul';

export function Modal({ open, onOpenChange, title, children, footer }) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.4)',
        }} />
        <Drawer.Content style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2001,
          background: 'var(--surface)',
          borderTopLeftRadius: 'var(--r-xl)',
          borderTopRightRadius: 'var(--r-xl)',
          padding: 'var(--s-4) var(--s-4) calc(var(--s-5) + env(safe-area-inset-bottom))',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text)',
          maxHeight: '90dvh',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            width: 40, height: 4, background: 'var(--border-strong)',
            borderRadius: 'var(--r-pill)', margin: '0 auto var(--s-3)',
          }} />
          {title && (
            <Drawer.Title style={{
              margin: 0, fontSize: 'var(--font-md)', fontWeight: 'var(--fw-semibold)',
              marginBottom: 'var(--s-3)',
            }}>
              {title}
            </Drawer.Title>
          )}
          <div style={{ overflowY: 'auto' }}>{children}</div>
          {footer && (
            <div style={{
              marginTop: 'var(--s-4)', display: 'flex', gap: 'var(--s-2)',
              justifyContent: 'flex-end',
            }}>
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function Button({ variant = 'primary', onClick, children, type = 'button', disabled }) {
  const bg = variant === 'primary' ? 'var(--accent)' : 'transparent';
  const color = variant === 'primary' ? 'var(--accent-text)' : 'var(--text)';
  const border = variant === 'primary' ? 'transparent' : 'var(--border)';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        borderRadius: 'var(--r-md)',
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontSize: 'var(--font-sm)',
        fontWeight: 'var(--fw-medium)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Prompt({ open, onOpenChange, title, placeholder, initialValue = '', onSubmit, submitLabel = 'OK', cancelLabel = 'Cancel', inputType = 'text' }) {
  const [value, setValue] = useState(initialValue);
  const submit = (e) => {
    e.preventDefault();
    onSubmit(value);
    setValue(initialValue);
  };
  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue(initialValue);
        onOpenChange(next);
      }}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
          <Button onClick={submit}>{submitLabel}</Button>
        </>
      }
    >
      <form onSubmit={submit}>
        <input
          autoFocus
          type={inputType}
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-elevated)',
            color: 'var(--text)',
            fontSize: 'var(--font-base)',
          }}
        />
      </form>
    </Modal>
  );
}
