import { Drawer } from 'vaul';
import { useState } from 'react';

export function DestinationSheet({ open, onClose, header, children }) {
  const [snap, setSnap] = useState(0.7);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      snapPoints={[0.4, 0.7]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      modal={false}
    >
      <Drawer.Portal>
        <Drawer.Content style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          background: '#fff',
          borderTopLeftRadius: 12, borderTopRightRadius: 12,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
          border: 'none', borderTop: '1px solid #ddd',
          zIndex: 400,
          display: 'flex', flexDirection: 'column',
          maxHeight: '96dvh',
          outline: 'none',
        }}>
          <Drawer.Title style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            Destinations
          </Drawer.Title>
          <div style={{
            padding: '8px 0', flexShrink: 0,
            display: 'flex', justifyContent: 'center',
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ccc' }} />
          </div>
          {header}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
