import React from 'react';
import { Cpu } from 'lucide-react';

const TIER_MESSAGES = {
  singularity: {
    title: '🌀 Singularity System Synthesis',
    subtitle: 'Synthesizing 360°+ multi-loop slingshots & sub-1° needle corridors...',
    tip: 'Retrieving elite top-0.1% golden seed orbital physics puzzle.',
    color: '#c084fc',
  },
  level5: {
    title: '🌀 Singularity System Synthesis',
    subtitle: 'Synthesizing 360°+ multi-loop slingshots & sub-1° needle corridors...',
    tip: 'Retrieving elite top-0.1% golden seed orbital physics puzzle.',
    color: '#c084fc',
  },
  nightmare: {
    title: '☠️ Nightmare System Synthesis',
    subtitle: 'Synthesizing hyper-narrow gravity funnels & orbital loop trajectories...',
    tip: 'Simulating multi-loop orbits to guarantee extreme difficulty solvability.',
    color: '#ef4444',
  },
  extreme: {
    title: '⚡ Extreme System Computation',
    subtitle: 'Computing 360° orbital assist captures & singularity paths...',
    tip: 'Running rejection sampling loops to eliminate direct sightlines.',
    color: '#a855f7',
  },
  hard: {
    title: '🔴 Hard System Optimization',
    subtitle: 'Designing multi-body gravitational deflection corridors...',
    tip: 'Balancing planetary occlusion and launch window density.',
    color: '#f43f5e',
  },
  medium: {
    title: '🟡 Medium System Assembly',
    subtitle: 'Building standard gravitational slingshot vectors...',
    tip: 'Ensuring balanced orbital mechanics and clear sightlines.',
    color: '#f59e0b',
  },
  easy: {
    title: '🟢 Easy System Layout',
    subtitle: 'Generating straightforward orbital flight path...',
    tip: 'Wide target window with direct launch availability.',
    color: '#10b981',
  },
  auto: {
    title: '🎲 Random Procedural Synthesis',
    subtitle: 'Generating dynamic orbital flight paths & solar system layout...',
    tip: 'Verifying solvability across candidate trajectories.',
    color: '#38bdf8',
  },
};

export function LevelGenerationModal({ isOpen, difficultyTier = 'auto' }) {
  if (!isOpen) return null;

  const info = TIER_MESSAGES[difficultyTier] || TIER_MESSAGES.auto;

  return (
    <div className="level-generation-overlay">
      <div className="level-generation-modal" style={{ borderColor: info.color }}>
        <div className="level-spinner-ring" style={{ borderTopColor: info.color }} />

        <div>
          <h3 style={{ margin: '0 0 4px 0', color: '#f8fafc', fontSize: '1.15rem', fontWeight: '800' }}>
            {info.title}
          </h3>
          <div style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.4' }}>
            {info.subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '0.76rem',
            color: '#94a3b8',
            maxWidth: '100%',
          }}
        >
          <Cpu size={16} color={info.color} style={{ flexShrink: 0 }} />
          <span>{info.tip}</span>
        </div>
      </div>
    </div>
  );
}
