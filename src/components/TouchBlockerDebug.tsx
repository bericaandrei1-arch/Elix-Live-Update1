import React, { useEffect } from 'react';

/**
 * DEBUG COMPONENT: Touch Blocker Debugger
 * 
 * 1. Highlights absolute positioned elements
 * 2. Logs all clicks
 * 3. Helps identify transparent overlays stealing touches
 */
export const TouchBlockerDebug = () => {
  const [active, setActive] = React.useState(false);
  
  useEffect(() => {
    // Only run if toggled on
    if (!active) {
      document.body.classList.remove('debug-touch-active');
      return;
    }
    
    document.body.classList.add('debug-touch-active');
    
    // Global click logger
    const handleClick = (e: MouseEvent) => {
      console.log('👆 CLICK DETECTED:', {
        target: e.target,
        x: e.clientX,
        y: e.clientY,
        path: e.composedPath()
      });
      
      // Flash the target
      const target = e.target as HTMLElement;
      if (target && target.style) {
        const originalOutline = target.style.outline;
        target.style.outline = '2px solid red';
        setTimeout(() => {
          target.style.outline = originalOutline;
        }, 200);
      }
    };
    
    window.addEventListener('click', handleClick, true); // Capture phase
    
    return () => {
      window.removeEventListener('click', handleClick, true);
      document.body.classList.remove('debug-touch-active');
    };
  }, [active]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div style={{ fontWeight: 'bold', borderBottom: '1px solid #555', paddingBottom: '4px' }}>
        Touch Debugger
      </div>
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
        <input 
          type="checkbox" 
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Enable Highlighter
      </label>
      
      {active && (
        <div style={{ marginTop: '4px', color: '#ff5555' }}>
          See console for logs
        </div>
      )}

      <style>{`
        .debug-touch-active * {
          /* Highlight all elements on hover to see bounds */
          outline: 1px solid rgba(0, 255, 255, 0.1) !important;
        }
        
        .debug-touch-active *:hover {
          outline: 1px solid rgba(0, 255, 255, 0.8) !important;
          background-color: rgba(0, 255, 255, 0.05) !important;
        }
        
        /* Highlight absolute positioned elements specifically */
        .debug-touch-active div[style*="absolute"],
        .debug-touch-active div[class*="absolute"] {
          outline: 2px dashed rgba(255, 0, 255, 0.5) !important;
        }
        
        /* Highlight fixed positioned elements */
        .debug-touch-active div[style*="fixed"],
        .debug-touch-active div[class*="fixed"] {
          outline: 2px dashed rgba(255, 255, 0, 0.5) !important;
        }
      `}</style>
    </div>
  );
};
