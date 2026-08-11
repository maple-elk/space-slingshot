import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '../App';
import SpaceSlingshot from '../components/SpaceSlingshot';

describe('Full App Rendering', () => {
  it('renders App component to string without crashing', () => {
    const html = renderToString(<App />);
    expect(html).toContain('app-container');
    expect(html).toContain('Space Slingshot');
  });

  it('renders SpaceSlingshot component to string without crashing or rendering NaN metrics', () => {
    const html = renderToString(<SpaceSlingshot soundEnabled={true} onToggleSound={() => {}} isFullscreen={false} onToggleFullscreen={() => {}} />);
    expect(html).toContain('slingshot-telemetry-bar');
    expect(html).toContain('telemetry-stats');
    expect(html).toContain('Fullscreen');
    expect(html).not.toContain('NaN');
  });
});
