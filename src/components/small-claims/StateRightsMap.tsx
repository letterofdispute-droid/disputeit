import { useEffect, useRef, useState } from 'react';

interface StateRightsMapProps {
  selectedState: string;
  onStateSelect: (code: string) => void;
}

const StateRightsMap = ({ selectedState, onStateSelect }: StateRightsMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);

  // Fetch SVG once
  useEffect(() => {
    fetch('/images/us-map.svg')
      .then(r => r.text())
      .then(text => {
        const cleaned = text
          .replace('stroke:#000; fill: none;', 'stroke-linejoin: round;')
          .replace(/fill:#f9f9f9/g, 'fill:hsl(var(--primary-foreground) / 0.15)');
        setSvgContent(cleaned);
      });
  }, []);

  // Apply interactivity whenever SVG or selection changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    svgEl.setAttribute('viewBox', '0 0 1000 589');
    svgEl.style.width = '100%';
    svgEl.style.height = 'auto';
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');

    const paths = svgEl.querySelectorAll('path[id]');

    const labelOffsets: Record<string, { dx: number; dy: number }> = {
      FL: { dx: 15, dy: -10 }, NH: { dx: 10, dy: 0 }, VT: { dx: -5, dy: 0 },
      MA: { dx: 12, dy: 0 }, RI: { dx: 12, dy: 0 }, CT: { dx: 10, dy: 5 },
      NJ: { dx: 10, dy: 0 }, DE: { dx: 12, dy: 0 }, MD: { dx: 20, dy: 5 },
      DC: { dx: 20, dy: 10 }, HI: { dx: 0, dy: -5 }, MI: { dx: 15, dy: 10 },
      LA: { dx: -5, dy: 5 }, ID: { dx: 0, dy: 10 },
    };

    // Remove old labels
    svgEl.querySelector('.state-labels')?.remove();
    svgEl.querySelector('.state-labels-style')?.remove();

    // Style paths
    paths.forEach(path => {
      const code = path.getAttribute('id') || '';
      const el = path as SVGPathElement;
      const isSelected = code === selectedState;

      el.style.fill = isSelected
        ? 'hsl(var(--accent))'
        : 'hsl(var(--primary-foreground) / 0.15)';
      el.style.stroke = 'hsl(var(--primary) / 0.6)';
      el.style.strokeWidth = isSelected ? '2' : '0.8';
      el.style.cursor = 'pointer';
      el.style.transition = 'fill 0.2s, stroke-width 0.2s';

      // Clone to remove old listeners
      const newEl = el.cloneNode(true) as SVGPathElement;
      el.parentNode?.replaceChild(newEl, el);

      newEl.addEventListener('click', () => onStateSelect(code));
      newEl.addEventListener('mouseenter', () => {
        if (code !== selectedState) {
          newEl.style.fill = 'hsl(var(--accent) / 0.6)';
        }
      });
      newEl.addEventListener('mouseleave', () => {
        if (code !== selectedState) {
          newEl.style.fill = 'hsl(var(--primary-foreground) / 0.15)';
        }
      });
    });

    // Add labels (desktop only)
    const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelGroup.classList.add('state-labels');
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.classList.add('state-labels-style');
    styleEl.textContent = `
      @media (max-width: 768px) { .state-labels { display: none; } }
      .state-label { pointer-events: none; font-family: system-ui, sans-serif; }
    `;
    svgEl.appendChild(styleEl);

    const currentPaths = svgEl.querySelectorAll('path[id]');
    currentPaths.forEach(path => {
      const code = path.getAttribute('id') || '';
      const bbox = (path as SVGGraphicsElement).getBBox();
      const offset = labelOffsets[code] || { dx: 0, dy: 0 };
      const cx = bbox.x + bbox.width / 2 + offset.dx;
      const cy = bbox.y + bbox.height / 2 + offset.dy;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', String(cx));
      text.setAttribute('y', String(cy));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('class', 'state-label');
      const size = Math.min(bbox.width, bbox.height) < 20 ? 7 : 9;
      text.setAttribute('font-size', String(size));
      text.setAttribute('font-weight', code === selectedState ? '700' : '500');
      text.setAttribute('fill', code === selectedState ? 'hsl(var(--primary))' : 'hsl(var(--primary-foreground) / 0.7)');
      text.textContent = code;
      labelGroup.appendChild(text);
    });

    svgEl.appendChild(labelGroup);
  }, [svgContent, selectedState, onStateSelect]);

  return (
    <div
      ref={containerRef}
      className="w-full"
      role="img"
      aria-label="Interactive US map — click a state to see its consumer protection laws"
      dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
    />
  );
};

export default StateRightsMap;
