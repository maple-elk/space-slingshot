import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SpaceSlingshot from './components/SpaceSlingshot';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen API toggle handler
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Listen to native browser fullscreen change events (e.g. user hits ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className={`app-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
      <Navbar
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
      <main style={isFullscreen ? { flex: 1, height: 'calc(100vh - 90px)' } : {}}>
        <SpaceSlingshot soundEnabled={soundEnabled} isFullscreen={isFullscreen} />
      </main>
    </div>
  );
}
