import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import SpaceSlingshot from './components/SpaceSlingshot';

export default function App() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensionMode, setDimensionMode] = useState('2d'); // '2d' | '3d' | 'solar'
  const [enableSolarOrbit, setEnableSolarOrbit] = useState(false);

  const handleSelectDimensionMode = useCallback((mode) => {
    setDimensionMode(mode);
    setEnableSolarOrbit(mode === 'solar');
  }, []);

  const handleToggleSolarOrbit = useCallback((enabled) => {
    setEnableSolarOrbit(enabled);
    if (enabled) {
      setDimensionMode('solar');
    }
  }, []);

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

  // Listen to native browser fullscreen change events
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
        dimensionMode={dimensionMode}
        onSelectDimensionMode={handleSelectDimensionMode}
        enableSolarOrbit={enableSolarOrbit}
        onToggleSolarOrbit={handleToggleSolarOrbit}
      />
      <main style={isFullscreen ? { flex: 1, height: 'calc(100vh - 90px)' } : {}}>
        <SpaceSlingshot
          soundEnabled={soundEnabled}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          dimensionMode={dimensionMode}
          onSelectDimensionMode={handleSelectDimensionMode}
          enableSolarOrbitExt={enableSolarOrbit}
          onToggleSolarOrbit={handleToggleSolarOrbit}
        />
      </main>
    </div>
  );
}
