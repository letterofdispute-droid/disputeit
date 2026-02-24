import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { smallClaimsData, formatFilingLimit, type SmallClaimsStateData } from '@/data/smallClaimsData';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * SVG path data for all 50 US states + DC.
 * Simplified paths for a clean, recognizable map.
 */
const STATE_PATHS: Record<string, string> = {
  AL: 'M628,466 L628,520 L618,545 L623,552 L642,548 L645,520 L648,466Z',
  AK: 'M161,485 L183,485 L183,510 L220,510 L220,530 L186,530 L161,530Z',
  AZ: 'M205,410 L280,410 L280,500 L250,510 L205,510Z',
  AR: 'M555,430 L620,430 L625,465 L622,490 L555,490Z',
  CA: 'M100,280 L160,280 L175,340 L190,410 L165,490 L120,490 L100,430Z',
  CO: 'M280,310 L380,310 L380,390 L280,390Z',
  CT: 'M820,230 L850,225 L855,250 L825,255Z',
  DE: 'M780,310 L795,305 L800,330 L785,335Z',
  FL: 'M640,520 L710,500 L730,520 L720,580 L690,610 L660,580 L640,545Z',
  GA: 'M650,430 L710,430 L720,500 L680,520 L645,520 L648,466Z',
  HI: 'M260,545 L310,535 L315,555 L265,565Z',
  ID: 'M210,140 L260,140 L270,190 L250,280 L210,280Z',
  IL: 'M575,260 L615,260 L620,290 L615,380 L590,400 L570,370 L575,300Z',
  IN: 'M620,260 L655,260 L655,380 L620,390 L615,290Z',
  IA: 'M490,230 L570,230 L575,260 L570,300 L490,300Z',
  KS: 'M380,340 L490,340 L490,410 L380,410Z',
  KY: 'M610,380 L720,360 L720,400 L660,420 L610,420Z',
  LA: 'M555,490 L620,490 L625,540 L600,560 L565,545 L555,520Z',
  ME: 'M845,110 L870,100 L880,150 L855,175 L840,155Z',
  MD: 'M730,300 L790,290 L800,320 L760,335 L730,320Z',
  MA: 'M825,205 L870,195 L875,210 L830,220Z',
  MI: 'M590,140 L640,140 L660,180 L650,250 L610,250 L590,200Z',
  MN: 'M470,100 L540,100 L545,220 L470,220Z',
  MS: 'M590,430 L625,430 L628,466 L625,520 L590,530 L585,465Z',
  MO: 'M500,340 L570,340 L575,370 L590,400 L555,430 L500,430Z',
  MT: 'M230,80 L370,80 L370,160 L280,160 L230,140Z',
  NE: 'M350,260 L470,260 L490,300 L490,340 L380,340 L350,310Z',
  NV: 'M160,250 L215,250 L215,400 L180,410 L160,360Z',
  NH: 'M840,140 L855,135 L858,195 L840,200Z',
  NJ: 'M790,255 L808,250 L810,300 L795,315 L785,290Z',
  NM: 'M250,400 L350,400 L350,510 L250,510Z',
  NY: 'M730,160 L820,145 L830,200 L780,245 L730,245Z',
  NC: 'M660,380 L790,360 L800,390 L720,400 L660,420Z',
  ND: 'M370,80 L470,80 L470,160 L370,160Z',
  OH: 'M655,260 L720,250 L725,340 L660,350 L655,290Z',
  OK: 'M380,400 L490,400 L510,430 L555,430 L555,460 L420,460 L380,430Z',
  OR: 'M100,140 L210,140 L210,230 L100,230Z',
  PA: 'M710,240 L790,230 L790,290 L730,300 L710,280Z',
  RI: 'M845,225 L860,222 L862,240 L847,243Z',
  SC: 'M680,415 L745,395 L755,425 L710,445 L680,435Z',
  SD: 'M370,160 L470,160 L470,240 L370,240Z',
  TN: 'M570,400 L715,380 L720,410 L660,420 L570,430Z',
  TX: 'M350,430 L420,430 L450,460 L530,460 L555,490 L555,520 L530,580 L460,600 L400,560 L350,520Z',
  UT: 'M230,250 L290,250 L290,390 L230,390Z',
  VT: 'M825,130 L840,125 L842,195 L828,200Z',
  VA: 'M680,330 L780,310 L790,350 L720,370 L680,365Z',
  WA: 'M110,60 L210,60 L210,140 L160,140 L110,120Z',
  WV: 'M700,310 L740,295 L745,360 L720,370 L700,340Z',
  WI: 'M530,120 L590,120 L600,200 L575,240 L530,240 L520,180Z',
  WY: 'M270,160 L370,160 L370,250 L270,250Z',
  DC: 'M763,318 L772,315 L775,325 L766,328Z',
};

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
  const [hovered, setHovered] = useState<SmallClaimsStateData | null>(null);

  const stateByCode = new Map(smallClaimsData.map(s => [s.code, s]));

  return (
    <section className="py-16">
      <div className="container-wide">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
            Click Your State
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select any state on the map to see filing limits, fees, and court rules.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <TooltipProvider delayDuration={0}>
            <svg
              viewBox="80 50 820 580"
              className="w-full h-auto"
              role="img"
              aria-label="Interactive US map showing small claims court filing limits by state"
            >
              {Object.entries(STATE_PATHS).map(([code, d]) => {
                const state = stateByCode.get(code);
                if (!state) return null;

                return (
                  <Tooltip key={code}>
                    <TooltipTrigger asChild>
                      <path
                        d={d}
                        fill={hovered?.code === code ? 'hsl(var(--primary))' : getStateColor(state.filingLimit)}
                        stroke="hsl(var(--background))"
                        strokeWidth="2"
                        className="cursor-pointer transition-colors duration-150 hover:opacity-90"
                        onClick={() => navigate(`/small-claims/${state.slug}`)}
                        onMouseEnter={() => setHovered(state)}
                        onMouseLeave={() => setHovered(null)}
                        role="link"
                        aria-label={`${state.name}: ${formatFilingLimit(state.filingLimit)} limit`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-center">
                      <p className="font-semibold">{state.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Limit: {formatFilingLimit(state.filingLimit)} · Fee: {state.filingFee}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </svg>
          </TooltipProvider>

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
