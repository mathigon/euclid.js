// =============================================================================
// Euclid.js | Canvas Drawing Tools
// (c) Mathigon
// =============================================================================


import {intersections} from './intersection';
import {Rectangle} from './rectangle';
import {isAngle, isCircle, isEllipse, isLineLike, isPolygonLike, isPolyline, isRay, isSegment} from './types';
import {GeoElement, TWO_PI} from './utilities';


export interface CanvasDrawingOptions {
  fill?: string;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  box?: Rectangle;
}

type CanvasLineCap = 'butt' | 'round' | 'square';
type CanvasLineJoin = 'bevel' | 'miter' | 'round';


export function drawCanvas(ctx: CanvasRenderingContext2D, obj: GeoElement, options: CanvasDrawingOptions = {}): void {
  if (isAngle(obj)) return drawCanvas(ctx, obj.shape(!!options.fill), options);

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

  } else if (isLineLike(obj)) {
    if (!options.box) return;
    let [start, end] = intersections(obj, options.box);
    if (isRay(obj)) end = obj.p1;
    if (!start || !end) return;
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

  } else if (isCircle(obj)) {
    ctx.arc(obj.c.x, obj.c.y, obj.r, 0, TWO_PI);

  } else if (isPolygonLike(obj)) {
    const points = obj.points;
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();

  } else if (isPolyline(obj)) {
    ctx.moveTo(obj.points[0].x, obj.points[0].y);
    for (const p of obj.points.slice(1)) ctx.lineTo(p.x, p.y);

  } else if (isEllipse(obj)) {
    ctx.ellipse(obj.c.x, obj.c.y, obj.a, obj.b, obj.angle, 0, TWO_PI);
  }

  // TODO Support for Line, Ray, Arc and Sector objects

  if (options.fill) ctx.fill();
  if (options.stroke) ctx.stroke();
}
