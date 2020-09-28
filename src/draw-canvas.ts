// =============================================================================
// Euclid.js | Canvas Drawing Tools
// (c) Mathigon
// =============================================================================


/// <reference lib="dom" />
import {isCircle, isPolygon, isPolyline, isSegment} from './types';
import {GeoElement, TWO_PI} from './utilities';


export interface CanvasDrawingOptions {
  fill?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
}

type CanvasLineCap = 'butt' | 'round' | 'square';
type CanvasLineJoin = 'bevel' | 'miter' | 'round';


export function drawCanvas(ctx: CanvasRenderingContext2D, obj: GeoElement,
    options: CanvasDrawingOptions = {}) {
  if (options.fill) ctx.fillStyle = options.fill;
  if (options.opacity) ctx.globalAlpha = options.opacity;

  if (options.stroke) {
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.strokeWidth || 1;
    if (options.lineCap) ctx.lineCap = options.lineCap;
    if (options.lineJoin) ctx.lineJoin = options.lineJoin;
  }

  ctx.beginPath();

  if (isSegment(obj)) {
    ctx.moveTo(obj.p1.x, obj.p1.y);
    ctx.lineTo(obj.p2.x, obj.p2.y);

  } else if (isCircle(obj)) {
    ctx.arc(obj.c.x, obj.c.y, obj.r, 0, TWO_PI);

  } else if (isPolygon(obj)) {
    ctx.moveTo(obj.points[0].x, obj.points[0].y);
    for (const p of obj.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();

  } else if (isPolyline(obj)) {
    ctx.moveTo(obj.points[0].x, obj.points[0].y);
    for (const p of obj.points.slice(1)) ctx.lineTo(p.x, p.y);
  }

  // TODO Support for Line, Ray, Arc, Sector, Angle and Rectangle objects

  if (options.fill) ctx.fill();
  if (options.stroke) ctx.stroke();
}
