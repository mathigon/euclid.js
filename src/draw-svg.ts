// =============================================================================
// Euclid.js | SVG Drawing Tools
// (c) Mathigon
// =============================================================================


import {isOneOf} from '@mathigon/core';
import {clamp} from '@mathigon/fermat';
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

// Reference for CIRCLE_MAGIC
// https://stackoverflow.com/questions/1734745/how-to-create-circle-with-b%C3%A9zier-curves
const CIRCLE_MAGIC = 4*(Math.sqrt(2)-1)/3;

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

/** Returns the four Cubic Bezier points need to round off a corner */
export function getBezierPoints(points: Point[], radius: number) {
  const length0 = Point.distance(points[0], points[1]);
  const length1 = Point.distance(points[1], points[2]);

  const r1 = Math.max(0.1, length0/2);
  const r2 = Math.max(0.1, length1/2);
  const rad = Math.min(radius, r1, r2);

  const d1 = rad/length0;
  const d2 = rad/length1;
  const shift = 1 - CIRCLE_MAGIC;

  const p1 = Point.interpolate(points[0], points[1], clamp(1 - d1, 0, 1));
  const p2 = Point.interpolate(points[0], points[1], clamp(1 - d1*shift, 0, 1));
  const p3 = Point.interpolate(points[1], points[2], clamp(d2*shift, 0, 1));
  const p4 = Point.interpolate(points[1], points[2], clamp(d2, 0, 1));

  return [p1, p2, p3, p4];
}

function drawRoundedPath(points: Point[], radius: number, close = false) {
  if (radius < 0) radius = 0;
  let path = 'M';

  if (!close) {
    path += `${points[0].x} ${points[0].y}`;
  } else {
    const p1 = points[points.length - 1];
    const p2 = points[0];
    const p3 = points[1];
    const offsets = getBezierPoints([p1, p2, p3], radius);
    path += `${offsets[3].x} ${offsets[3].y}`;
  }

  for (let index = 0; index < points.length; index++) {
    if (index < points.length - 2 || close) {
      const p1 = points[index];
      const p2 = points[(index + 1) % points.length];
      const p3 = points[(index + 2) % points.length];

      // Get points radius away from the next vertex on each line.
      const offsets = getBezierPoints([p1, p2, p3], radius).map(p => `${p.x} ${p.y}`);

      // Draw a line that is radius away from the next handle
      // Draw a cubic bezier using the other radius offset + the magic circle points.
      path += `L${offsets[0]}C${offsets[1]} ${offsets[2]} ${offsets[3]}`;

    } else if (index === points.length - 2 && !close) {
      // on the last move, just draw a line.
      path += `L${points[index + 1].x} ${points[index + 1].y}`;
    }
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
    if (options.cornerRadius) return drawRoundedPath(obj.points, options.cornerRadius, false);
    return drawPath(...obj.points);
  }

  if (isPolygon(obj) || (isRectangle(obj) && options.cornerRadius)) {
    if (options.cornerRadius) {
      return drawRoundedPath(obj.points, options.cornerRadius, true);
    }
    return `${drawPath(...obj.points)}Z`;
  }

  if (isRectangle(obj)) {
    return `${drawPath(...obj.polygon.points)}Z`;
  }

  return '';
}
