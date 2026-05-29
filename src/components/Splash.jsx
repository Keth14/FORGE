export function Splash() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#050403',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 72,
          letterSpacing: '0.2em',
          color: '#e7e5e4',
          lineHeight: 1,
          animation: 'fadeInUp 0.9s ease forwards',
        }}>
          FORGE
        </div>
        <div style={{
          height: 1,
          background: '#f59e0b',
          margin: '14px auto 0',
          animation: 'expandLine 0.7s ease 0.8s both',
        }} />
        <div style={{
          fontSize: 9,
          color: '#44403c',
          letterSpacing: '0.3em',
          marginTop: 14,
          animation: 'fadeInSub 0.8s ease 1.3s both',
        }}>
          BEHAVIORAL CONTINUITY SYSTEM
        </div>
        <div style={{
          fontSize: 8,
          color: '#292524',
          letterSpacing: '0.25em',
          marginTop: 6,
          animation: 'fadeInSub 0.8s ease 1.7s both',
        }}>
          BUILT FOR KETH
        </div>
      </div>
    </div>
  )
}
