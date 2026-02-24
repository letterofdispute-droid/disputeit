import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { smallClaimsData, formatFilingLimit, type SmallClaimsStateData } from '@/data/smallClaimsData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** Filing limit color scale */
function getStateColor(limit: number): string {
  if (limit >= 15000) return 'hsl(var(--primary))';
  if (limit >= 10000) return 'hsl(var(--primary) / 0.75)';
  if (limit >= 7000) return 'hsl(var(--primary) / 0.55)';
  if (limit >= 5000) return 'hsl(var(--accent) / 0.7)';
  return 'hsl(var(--accent) / 0.45)';
}

const USMap = () => {
  const navigate = useNavigate();
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [tooltipState, setTooltipState] = useState<SmallClaimsStateData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const stateByCode = new Map(smallClaimsData.map(s => [s.code, s]));

  // Load SVG content
  useEffect(() => {
    fetch('/images/us-map.svg')
      .then(r => r.text())
      .then(text => {
        // Strip root SVG's fill:none and black stroke so our JS fills work
        const cleaned = text
          .replace('stroke:#000; fill: none;', 'stroke-linejoin: round;')
          .replace(/fill:#f9f9f9/g, 'fill:hsl(var(--accent) / 0.45)');
        setSvgContent(cleaned);
      });
  }, []);

  // After SVG is injected, apply interactivity
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container || !svgContent) return;

    const svgEl = container.querySelector('svg');
    if (!svgEl) return;

    // Set viewBox and responsive sizing
    svgEl.setAttribute('viewBox', '0 0 1000 589');
    svgEl.style.width = '100%';
    svgEl.style.height = 'auto';
    svgEl.removeAttribute('width');
    svgEl.removeAttribute('height');

    // Style all state paths
    const paths = svgEl.querySelectorAll('path[id]');
    paths.forEach(path => {
      const code = path.getAttribute('id') || '';
      const state = stateByCode.get(code);
      if (!state) return;

      const el = path as SVGPathElement;
      el.style.fill = getStateColor(state.filingLimit);
      el.style.stroke = 'hsl(var(--background))';
      el.style.strokeWidth = '1.2';
      el.style.cursor = 'pointer';
      el.style.transition = 'fill 0.15s, opacity 0.15s';

      el.addEventListener('click', () => {
        navigate(`/small-claims/${state.slug}`);
      });

      el.addEventListener('mouseenter', (e) => {
        el.style.fill = 'hsl(var(--primary))';
        el.style.opacity = '0.9';
        setHoveredCode(code);
        setTooltipState(state);
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: (e as MouseEvent).clientX - rect.left,
          y: (e as MouseEvent).clientY - rect.top,
        });
      });

      el.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: (e as MouseEvent).clientX - rect.left,
          y: (e as MouseEvent).clientY - rect.top,
        });
      });

      el.addEventListener('mouseleave', () => {
        el.style.fill = getStateColor(state.filingLimit);
        el.style.opacity = '1';
        setHoveredCode(null);
        setTooltipState(null);
      });
    });
  }, [svgContent, navigate]);

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container-wide">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
            Click Your State
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select any state on the map to see filing limits, fees, and court rules.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
          <div
            ref={svgContainerRef}
            className="w-full"
            role="img"
            aria-label="Interactive US map showing small claims court filing limits by state"
            dangerouslySetInnerHTML={svgContent ? { __html: svgContent } : undefined}
          />

          {/* Custom tooltip */}
          {tooltipState && (
            <div
              className="absolute z-50 pointer-events-none bg-popover border rounded-md px-3 py-1.5 shadow-md text-center"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 60,
                transform: 'translateX(-50%)',
              }}
            >
              <p className="font-semibold text-sm text-popover-foreground">{tooltipState.name}</p>
              <p className="text-xs text-muted-foreground">
                Limit: {formatFilingLimit(tooltipState.filingLimit)} · Fee: {tooltipState.filingFee}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            {[
              { label: '$15k+', color: 'hsl(var(--primary))' },
              { label: '$10k–$15k', color: 'hsl(var(--primary) / 0.75)' },
              { label: '$7k–$10k', color: 'hsl(var(--primary) / 0.55)' },
              { label: '$5k–$7k', color: 'hsl(var(--accent) / 0.7)' },
              { label: 'Under $5k', color: 'hsl(var(--accent) / 0.45)' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default USMap;
