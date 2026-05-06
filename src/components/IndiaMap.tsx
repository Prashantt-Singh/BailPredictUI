import React, { useMemo } from 'react';
import { geoIdentity, geoPath } from 'd3-geo';
import indiaGeoJson from '../data/india.geo.json';
import { STATE_NAME_TO_CODE } from '../data/stateMapping';

interface IndiaMapProps {
  data: Record<string, number>; // Mapping of state code to grant rate
  onStateClick: (stateCode: string, stateName: string) => void;
  selectedStateCode: string | null;
}

const IndiaMap: React.FC<IndiaMapProps> = ({ data, onStateClick, selectedStateCode }) => {
  
  // Highcharts GeoJSON comes pre-projected in arbitrary x/y coordinates
  // so we use geoIdentity to just scale it into our viewBox
  const projection = useMemo(() => {
    return geoIdentity()
      .reflectY(true) // Flip Y axis because SVG Y goes down but maps go up
      .fitSize([600, 700], indiaGeoJson as any);
  }, []);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const getColor = (rate: number | undefined) => {
    if (rate === undefined) return '#1e293b'; // Base gray for no data
    if (rate < 30) return '#ef4444'; // Red
    if (rate < 45) return '#f97316'; // Orange
    if (rate < 55) return '#f59e0b'; // Amber
    if (rate < 70) return '#22c55e'; // Emerald
    return '#059669'; // Deep Green
  };

  return (
    <svg viewBox="0 0 600 700" className="w-full h-full drop-shadow-2xl">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g>
        {indiaGeoJson.features.map((feature: any, i: number) => {
          // Let's use `hc-key` (which are full lowercase names here) to get standard state codes
          const hcKey = (feature.properties['hc-key'] || '').toLowerCase();
          const stateCode = STATE_NAME_TO_CODE[hcKey] || hcKey.toUpperCase();
          const stateName = feature.properties.name || hcKey;
          
          const grantRate = data[stateCode];
          const isSelected = selectedStateCode === stateCode;

          return (
            <path
              key={`path-${i}`}
              d={pathGenerator(feature) || ''}
              fill={getColor(grantRate)}
              stroke={isSelected ? '#C9A84C' : '#0a0f1e'}
              strokeWidth={isSelected ? 3 : 0.5}
              filter={isSelected ? "url(#glow)" : ""}
              className={`cursor-pointer transition-all duration-300 ${!isSelected && 'hover:brightness-125'} ${isSelected ? 'z-10 relative' : ''}`}
              onClick={() => onStateClick(stateCode, stateName)}
              onMouseEnter={(e) => {
                // We can add simple native tooltips by setting title
                const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
                title.textContent = `${stateName}: ${grantRate ? grantRate + '%' : 'N/A'}`;
                e.currentTarget.appendChild(title);
              }}
              onMouseLeave={(e) => {
                const title = e.currentTarget.querySelector('title');
                if (title) e.currentTarget.removeChild(title);
              }}
            />
          );
        })}
      </g>
    </svg>
  );
};

export default IndiaMap;
