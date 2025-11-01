import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

interface ThemeTransitionOptions {
  x: number;
  y: number;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const createThemeTransition = useCallback((options: ThemeTransitionOptions, newTheme: Theme) => {
    setIsTransitioning(true);

    // Create backdrop overlay for subtle effect
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.pointerEvents = 'none';
    backdrop.style.zIndex = '5'; // Between background and content
    backdrop.style.background = `${newTheme === 'dark' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`;
    backdrop.style.opacity = '0';
    backdrop.style.transition = 'opacity 0.8s ease-out';

    // Create the expanding circle overlay that passes through content
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '1'; // Behind main content
    overlay.style.overflow = 'hidden';

    // Create the expanding circle
    const circle = document.createElement('div');
    const maxRadius = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
    
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.transform = 'translate(-50%, -50%)';
    circle.style.left = `${options.x}px`;
    circle.style.top = `${options.y}px`;
    circle.style.width = '0px';
    circle.style.height = '0px';
    circle.style.transition = 'width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), height 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // Set the circle color with enhanced visual effect
    if (newTheme === 'dark') {
      circle.style.background = `radial-gradient(circle, oklch(0.145 0 0) 0%, oklch(0.145 0 0) 70%, transparent 100%)`;
    } else {
      circle.style.background = `radial-gradient(circle, #ffffff 0%, #ffffff 70%, transparent 100%)`;
    }
    
    // Add enhanced glow effect
    circle.style.boxShadow = `
      0 0 50px 10px ${newTheme === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)'},
      0 0 100px 30px ${newTheme === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}
    `;

    overlay.appendChild(circle);
    document.body.appendChild(backdrop);
    document.body.appendChild(overlay);

    // Apply theme change immediately
    applyTheme(newTheme);

    // Start the animations
    requestAnimationFrame(() => {
      circle.style.width = `${maxRadius * 2}px`;
      circle.style.height = `${maxRadius * 2}px`;
      backdrop.style.opacity = '1';
    });

    // Fade out backdrop partway through
    setTimeout(() => {
      backdrop.style.opacity = '0';
    }, 400);

    // Clean up after animation
    setTimeout(() => {
      document.body.removeChild(overlay);
      document.body.removeChild(backdrop);
      setIsTransitioning(false);
    }, 800);
  }, []);

  const toggleTheme = useCallback((options?: ThemeTransitionOptions) => {
    if (isTransitioning) return;

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (options) {
      createThemeTransition(options, newTheme);
    } else {
      applyTheme(newTheme);
    }
  }, [theme, isTransitioning, createThemeTransition]);

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isTransitioning
  };
}