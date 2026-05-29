const TABS = [
  ['today',  'TODAY'],
  ['goals',  'GOALS'],
  ['log',    'LOG'],
  ['intel',  'INTEL'],
  ['talk',   'TALK'],
  ['you',    'YOU'],
  ['me',     'ME'],
]

export function Nav({ view, setView, mc }) {
  return (
    <nav style={{
      display: 'flex',
      borderBottom: `1px solid ${mc.border}`,
      background: `${mc.bg}e8`,
      position: 'sticky',
      top: 62,
      zIndex: 99,
      transition: 'all 1.5s',
      overflowX: 'auto',
    }}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          onClick={() => setView(id)}
          style={{
            flex: 1,
            minWidth: 44,
            padding: '10px 4px',
            background: 'none',
            border: 'none',
            color: view === id ? mc.accent : '#44403c',
            cursor: 'pointer',
            fontSize: 9,
            letterSpacing: '0.12em',
            borderBottom: view === id ? `2px solid ${mc.accent}` : 'none',
            transition: 'color 0.3s',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
