'use client';

import { useMemo } from 'react';
import { generateAirfoil, airfoilToSVGPath, rotateAirfoil } from '@/lib/cst';

interface DynamicAirfoilSVGProps {
  upperCoefficients: number[];
  lowerCoefficients: number[];
  angleOfAttack: number;
  width?: number;
  height?: number;
  showControlPoints?: boolean;
  fillColor?: string;
  strokeColor?: string;
  onPointDrag?: (surface: 'upper' | 'lower', index: number, value: number) => void;
}

export function DynamicAirfoilSVG({
  upperCoefficients,
  lowerCoefficients,
  angleOfAttack,
  width = 600,
  height = 400,
  showControlPoints = true,
  fillColor = 'rgba(59, 130, 246, 0.3)',
  strokeColor = '#2563eb',
  onPointDrag
}: DynamicAirfoilSVGProps) {
  const airfoilData = useMemo(() => {
    // Generate base airfoil from CST coefficients
    const { upper, lower } = generateAirfoil(upperCoefficients, lowerCoefficients, 100);
    
    // Apply rotation based on angle of attack
    const rotated = rotateAirfoil(upper, lower, angleOfAttack, 0.25);
    
    // Calculate SVG path
    const scale = Math.min(width, height) * 0.7;
    const offsetX = width / 2 - scale / 2;
    const offsetY = height / 2;
    
    const path = airfoilToSVGPath(rotated.upper, rotated.lower, scale, offsetX, offsetY);
    
    return { upper: rotated.upper, lower: rotated.lower, path, scale, offsetX, offsetY };
  }, [upperCoefficients, lowerCoefficients, angleOfAttack, width, height]);

  const controlPoints = useMemo(() => {
    const points: { x: number; y: number; surface: 'upper' | 'lower'; index: number }[] = [];
    
    // Sample control points from CST coefficients
    const sampleIndices = upperCoefficients.map((_, i) => Math.floor((i / upperCoefficients.length) * 100));
    
    sampleIndices.forEach((idx, i) => {
      if (idx < airfoilData.upper.length) {
        const pt = airfoilData.upper[idx];
        points.push({
          x: airfoilData.offsetX + pt.x * airfoilData.scale,
          y: airfoilData.offsetY - pt.y * airfoilData.scale,
          surface: 'upper',
          index: i
        });
      }
    });
    
    sampleIndices.forEach((idx, i) => {
      if (idx < airfoilData.lower.length) {
        const pt = airfoilData.lower[idx];
        points.push({
          x: airfoilData.offsetX + pt.x * airfoilData.scale,
          y: airfoilData.offsetY - pt.y * airfoilData.scale,
          surface: 'lower',
          index: i
        });
      }
    });
    
    return points;
  }, [airfoilData, upperCoefficients]);

  return (
    <svg width={width} height={height} className="w-full h-full">
      <defs>
        <linearGradient id="airfoilGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Coordinate axes */}
      <g opacity="0.3">
        <line
          x1={airfoilData.offsetX}
          y1={airfoilData.offsetY}
          x2={airfoilData.offsetX + airfoilData.scale}
          y2={airfoilData.offsetY}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1={airfoilData.offsetX + airfoilData.scale / 2}
          y1={airfoilData.offsetY - 100}
          x2={airfoilData.offsetX + airfoilData.scale / 2}
          y2={airfoilData.offsetY + 100}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      </g>

      {/* Airfoil shape */}
      <path
        d={airfoilData.path}
        fill="url(#airfoilGradient)"
        stroke={strokeColor}
        strokeWidth="3"
        filter="url(#glow)"
      />

      {/* Control points */}
      {showControlPoints && controlPoints.map((point, idx) => (
        <g key={`control-${point.surface}-${idx}`}>
          <circle
            cx={point.x}
            cy={point.y}
            r="6"
            fill={point.surface === 'upper' ? '#3b82f6' : '#22c55e'}
            stroke="white"
            strokeWidth="2"
            className="cursor-pointer hover:r-8 transition-all"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
          <circle
            cx={point.x}
            cy={point.y}
            r="12"
            fill="transparent"
            className="cursor-pointer"
          />
        </g>
      ))}

      {/* Leading edge marker */}
      <circle
        cx={airfoilData.offsetX}
        cy={airfoilData.offsetY}
        r="4"
        fill="#ef4444"
        stroke="white"
        strokeWidth="2"
      />

      {/* Trailing edge marker */}
      <circle
        cx={airfoilData.offsetX + airfoilData.scale}
        cy={airfoilData.offsetY}
        r="4"
        fill="#10b981"
        stroke="white"
        strokeWidth="2"
      />

      {/* AoA indicator arrow */}
      <g transform={`translate(${width - 100}, 50)`}>
        <line
          x1="0"
          y1="0"
          x2={50 * Math.cos((angleOfAttack * Math.PI) / 180)}
          y2={50 * Math.sin((angleOfAttack * Math.PI) / 180)}
          stroke="#a855f7"
          strokeWidth="3"
          markerEnd="url(#arrowhead)"
        />
        <text
          x="0"
          y="-10"
          fontSize="12"
          fontWeight="bold"
          fill="#6b7280"
          textAnchor="middle"
        >
          AoA: {angleOfAttack.toFixed(1)}°
        </text>
      </g>

      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
        </marker>
      </defs>

      {/* Scale reference */}
      <g transform={`translate(${airfoilData.offsetX}, ${height - 30})`}>
        <line
          x1="0"
          y1="0"
          x2={airfoilData.scale}
          y2="0"
          stroke="#6b7280"
          strokeWidth="2"
        />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#6b7280" strokeWidth="2" />
        <line
          x1={airfoilData.scale}
          y1="-5"
          x2={airfoilData.scale}
          y2="5"
          stroke="#6b7280"
          strokeWidth="2"
        />
        <text
          x={airfoilData.scale / 2}
          y="20"
          fontSize="12"
          fontWeight="500"
          fill="#6b7280"
          textAnchor="middle"
        >
          Chord Length = 1.0
        </text>
      </g>
    </svg>
  );
}
