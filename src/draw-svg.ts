// =============================================================================
// Euclid.js | SVG Drawing Tools
// (c) Mathigon
// =============================================================================


import {isOneOf} from '@mathigon/core';
import {toDeg} from './angle';
import {Arc} from './arc';
import {intersections} from './intersection';
import {Line} from './line';
import {Point} from './point';
import {Rectangle} from './rectangle';
import {isAngle, isArc, isCircle, isEllipse, isLine, isPolygon, isPolyline, isRay, isRectangle, isSector, isSegment} from './types';
import {GeoElement} from './utilities';


export type LineMark = 'bar'|'bar2'|'arrow'|'arrow2';
export type LineArrow = 'start'|'end'|'both';

export interface SVGDrawingOptions {
  round?: boolean;  // For angles (round vs square right angles)
  size?: number;  // For angles
  fill?: string;  // For angles (stroke arc vs fill sector)
  mark?: LineMark;  // For lines, rays, segments and arcs
  arrows?: LineArrow;  // For segments and arcs
  box?: Rectangle;  // For lines and rays (bounding box)
  cornerRadius?: number;  // For rectangles and polygons
}


// -----------------------------------------------------------------------------
// Utility Functions

/** Draws an arc from a to c, with center b. */
function drawArc(a: Point, b: Point, c: Point) {
  const orient = b.x * (c.y - a.y) + a.x * (b.y - c.y) + c.x * (a.y - b.y);
  const sweep = (orient > 0) ? 1 : 0;
  const size = Point.distance(b, a);
  return [a.x, `${a.y}A${size}`, size, 0, sweep, 1, c.x, c.y].join(',');
}

function drawPath(...points: Point[]) {
  return `M${points.map(p => `${p.x},${p.y}`).join('L')}`;
}


// -----------------------------------------------------------------------------
// Arrows and Line Marks

function drawLineMark(x: Line, type: LineMark) {
  const p = x.perpendicularVector.scale(6);
  const n = x.unitVector.scale(3);
  const m = x.midpoint;

  switch (type) {
    case 'bar':
      return drawPath(m.add(p), m.add(p.inverse));
    case 'bar2':
      return drawPath(m.add(n).add(p), m.add(n).add(p.inverse)) +
             drawPath(m.add(n.inverse).add(p), m.add(n.inverse).add(p.inverse));
    case 'arrow':
      return drawPath(m.add(n.inverse).add(p), m.add(n),
        m.add(n.inverse).add(p.inverse));
    case 'arrow2':
      return drawPath(m.add(n.scale(-2)).add(p), m,
        m.add(n.scale(-2)).add(p.inverse)) +
             drawPath(m.add(p), m.add(n.scale(2)), m.add(p.inverse));
    default:
      return '';
  }
}

function arrowPath(start: Point, normal: Point) {
  if (!start || !normal) return '';
  const perp = normal.perpendicular;
  const a = start.add(normal.scale(9)).add(perp.scale(9));
  const b = start.add(normal.scale(9)).add(perp.scale(-9));
  return drawPath(a, start, b);
}

function drawLineArrows(x: Line, type: LineArrow) {
  let path = '';
  if (isOneOf(type, 'start', 'both')) {
    path += arrowPath(x.p1, x.unitVector);
  }
  if (isOneOf(type, 'end', 'both')) {
    path += arrowPath(x.p2, x.unitVector.inverse);
  }
  return path;
}

function drawArcArrows(x: Arc, type: LineArrow) {
  let path = '';

  if (isOneOf(type, 'start', 'both')) {
    const normal = new Line(x.c, x.start).perpendicularVector.inverse;
    path += arrowPath(x.start, normal);
  }

  if (isOneOf(type, 'end', 'both')) {
    const normal = new Line(x.c, x.end).perpendicularVector;
    path += arrowPath(x.end, normal);
  }

  return path;
}

// top-left, top-right, btm-right, btm-left corner radius
export function drawRoundedRect(rect: Rectangle, tl: number, tr = tl, br = tl, bl = tr) {
  const {p, w, h} = rect;
  return `M${p.x} ${p.y + tl}a${tl} ${tl} 0 0 1 ${tl} ${-tl}h${w - tl - tr}a${tr} ${tr} 0 0 1 ${tr} ${tr}v${h - tr - br}a${br} ${br} 0 0 1 ${-br} ${br}h${-w + bl + br}a${bl} ${bl} 0 0 1 ${-bl} ${-bl}Z`;
}


// -----------------------------------------------------------------------------
// Draw Function

export function drawSVG(obj: GeoElement, options: SVGDrawingOptions = {}): string {

  if (isAngle(obj)) {
    const shape = obj.shape(!!options.fill, options.size, options.round);
    return drawSVG(shape, options);
  }

  if (isSegment(obj)) {
    if (obj.p1.equals(obj.p2)) return '';
    let line = drawPath(obj.p1, obj.p2);
    if (options.mark) line += drawLineMark(obj, options.mark);
    if (options.arrows) line += drawLineArrows(obj, options.arrows);
    return line;
  }

  if (isRay(obj)) {
    if (!options.box) return '';
    const end = intersections(obj, options.box)[0];
    if (!end) return '';
    let line = drawPath(obj.p1, end);
    if (options.mark) line += drawLineMark(obj, options.mark);
    return line;
  }

  if (isLine(obj)) {
    if (!options.box) return '';
    const points = intersections(obj, options.box);
    if (points.length < 2) return '';
    let line = drawPath(points[0], points[1]);
    if (options.mark) line += drawLineMark(obj, options.mark);
    return line;
  }

  if (isCircle(obj)) {
    return `M${obj.c.x - obj.r} ${obj.c.y}a${obj.r},${obj.r} 0 1 0 ` +
           `${2 * obj.r} 0a${obj.r} ${obj.r} 0 1 0 ${-2 * obj.r} 0Z`;
  }

  if (isEllipse(obj)) {
    const [u, v] = obj.majorVertices;
    const rot = toDeg(obj.angle);
    return `M${u.x} ${u.y}A${obj.a} ${obj.b} ${rot} 0 0 ${v.x} ${v.y}A${obj.a} ${obj.b} ${rot} 0 0 ${u.x} ${u.y}Z`;
  }

  if (isArc(obj)) {
    let path = `M${drawArc(obj.start, obj.c, obj.end)}`;
    if (options.arrows) path += drawArcArrows(obj, options.arrows);
    return path;
  }

  if (isSector(obj)) {
    return `M${obj.c.x} ${obj.c.y} L ${drawArc(obj.start, obj.c, obj.end)}Z`;
  }

  if (isPolyline(obj)) {
    return drawPath(...obj.points);
  }

  if (isPolygon(obj)) {
    // TODO Implement `options.cornerRadius`
    return `${drawPath(...obj.points)}Z`;
  }

  if (isRectangle(obj)) {
    if (!options.cornerRadius) return `${drawPath(...obj.polygon.points)}Z`;
    const rect = obj.unsigned;
    const radius = Math.min(options.cornerRadius, rect.w / 2, rect.h / 2);
    return drawRoundedRect(rect, radius);
  }

  return '';
}
