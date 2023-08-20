// =============================================================================
// Euclid.js | Boolean Operations for Polygons
// (c) Mathigon
// =============================================================================


import {last} from '@mathigon/core';
import {nearlyEquals} from '@mathigon/fermat';
import {Point} from './point';

// Based on https://github.com/velipso/polybooljs (MIT License)
// – Converted to typescript
// - Use Euclid.js's existing Point/Polygon classes
// – Removed unneeded features (e.g. GeoJSON support and inverted polygons)


// -----------------------------------------------------------------------------
// Utility Functions

const PRECISION = 0.001;

function pointAboveOrOnLine(pt: Point, left: Point, right: Point) {
  const d1 = (right.x - left.x) * (pt.y - left.y);
  const d2 = (right.y - left.y) * (pt.x - left.x);
  return d1 - d2 >= -PRECISION;
}

function pointBetween(p: Point, left: Point, right: Point) {
  // p must be collinear with left->right
  // returns false if p == left, p == right, or left == right
  const dpyly = p.y - left.y;
  const drxlx = right.x - left.x;
  const dpxlx = p.x - left.x;
  const dryly = right.y - left.y;

  const dot = dpxlx * drxlx + dpyly * dryly;
  // if `dot` is 0, then `p` == `left` or `left` == `right` (reject)
  // if `dot` is less than 0, then `p` is to the left of `left` (reject)
  if (dot < PRECISION) return false;

  const sqlen = drxlx * drxlx + dryly * dryly;
  // if `dot` > `sqlen`, then `p` is to the right of `right` (reject)
  // therefore, if `dot - sqlen` is greater than 0, then `p` is to the right of `right` (reject)
  return dot - sqlen <= -PRECISION;
}

function pointsCompare(p1: Point, p2: Point) {
  // returns -1 if p1 is smaller, 1 if p2 is smaller, 0 if equal
  if (nearlyEquals(p1.x, p2.x)) {
    return nearlyEquals(p1.y, p2.y) ? 0 : (p1.y < p2.y ? -1 : 1);
  }
  return p1.x < p2.x ? -1 : 1;
}

/**
 * Categorize where intersection point is along A and B:
 *  -2: intersection point is before segment's first point
 *  -1: intersection point is directly on segment's first point
 *   0: intersection point is between segment's first and second points (exclusive)
 *   1: intersection point is directly on segment's second point
 *   2: intersection point is after segment's second point
 */
function getOffset(A: number): -2|-1|0|1|2 {
  if (A <= -PRECISION) return -2;
  if (A < PRECISION) return -1;
  if (A - 1 <= -PRECISION) return 0;
  if (A - 1 < PRECISION) return 1;
  return 2;
}

function linesIntersect(a0: Point, a1: Point, b0: Point, b1: Point) {
  const adx = a1.x - a0.x;
  const ady = a1.y - a0.y;
  const bdx = b1.x - b0.x;
  const bdy = b1.y - b0.y;

  const axb = adx * bdy - ady * bdx;
  if (nearlyEquals(axb, 0)) return false;  // lines are coincident

  const dx = a0.x - b0.x;
  const dy = a0.y - b0.y;
  const A = (bdx * dy - bdy * dx) / axb;
  const B = (adx * dy - ady * dx) / axb;

  const pt = new Point(a0.x + A * adx, a0.y + A * ady);
  return {alongA: getOffset(A), alongB: getOffset(B), pt};
}


// -----------------------------------------------------------------------------
// Types

type Node<T> = {prev?: Node<T>, next?: Node<T>, root?: boolean, remove: () => void} & T;

interface Segment {
  start: Point;
  end: Point;
  myFill: {above?: boolean, below?: boolean};  // Is there fill above or below us?
  otherFill?: {above?: boolean, below?: boolean};
}

interface Event {
  isStart?: boolean;
  pt: Point;
  seg: Segment;
  primary?: boolean;
  other?: Node<Event>;
  status?: Node<Event>;
  ev?: Node<Event>;
}

type Status = {ev: Node<Event>};


// -----------------------------------------------------------------------------
// Linked List

class LinkedList<T> {
  // TODO Better types without any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  root: any = {root: true, next: undefined};

  exists(node: Node<T>) {
    return node !== undefined && node !== this.root;
  }

  get head() {
    return this.root.next;
  }

  insertBefore(node: Node<T>, check: (n: Node<T>) => boolean) {
    let last = this.root;
    let here = this.root.next;
    while (here) {
      if (check(here)) {
        node.prev = here.prev;
        node.next = here;
        here.prev.next = node;
        here.prev = node;
        return;
      }
      last = here;
      here = here.next;
    }
    last.next = node;
    node.prev = last;
    node.next = undefined;
  }

  findTransition(check: (n: Node<T>) => boolean) {
    let prev = this.root;
    let here = this.root.next;
    while (here) {
      if (check(here)) break;
      prev = here;
      here = here.next;
    }
    return {
      before: prev === this.root ? undefined : prev,
      after: here,
      insert: (node: Node<T>) => {
        node.prev = prev;
        node.next = here;
        prev.next = node;
        if (here) here.prev = node;
        return node;
      }
    };
  }

  static node<T>(data: T) {
    const d = data as Node<T>;  // TODO Fix this typing!
    d.remove = () => {
      if (d.prev) d.prev.next = d.next;
      if (d.next) d.next.prev = d.prev;
      d.prev = d.next = undefined;
    };
    return d;
  }
}


// -----------------------------------------------------------------------------
// Main Algorithm

function copy(start: Point, end: Point, seg: Segment) {
  const myFill = {above: seg.myFill.above, below: seg.myFill.below};
  return {start, end, myFill};
}

function eventCompare(p1isStart: boolean, p11: Point, p12: Point, p2isStart: boolean, p21: Point, p22: Point) {
  const comp = pointsCompare(p11, p21);
  if (comp !== 0) return comp;  // the selected points are the same

  // If the non-selected points are the same too then the segments are equal.
  if (Point.equals(p12, p22)) return 0;

  // If one is a start and the other isn't favor the one that isn't the start.
  if (p1isStart !== p2isStart) return p1isStart ? 1 : -1;

  // Otherwise, we'll have to calculate which one is below the other manually. Order matters!
  return pointAboveOrOnLine(p12, p2isStart ? p21 : p22, p2isStart ? p22 : p21,) ? 1 : -1;
}

function eventAdd(eventRoot: LinkedList<Event>, ev: Node<Event>, otherPt: Point) {
  eventRoot.insertBefore(ev, (here) =>
    eventCompare(!!ev.isStart, ev.pt, otherPt, !!here.isStart, here.pt, here.other!.pt) < 0);
}

function addSegmentStart(eventRoot: LinkedList<Event>, seg: Segment, primary: boolean) {
  const evStart = LinkedList.node({isStart: true, pt: seg.start, seg, primary});
  eventAdd(eventRoot, evStart, seg.end);
  return evStart;
}

function addSegmentEnd(eventRoot: LinkedList<Event>, evStart: Node<Event>, seg: Segment, primary: boolean) {
  const evEnd = LinkedList.node({pt: seg.end, seg, primary, other: evStart});
  evStart.other = evEnd;
  eventAdd(eventRoot, evEnd, evStart.pt);
}

function addSegment(eventRoot: LinkedList<Event>, seg: Segment, primary: boolean) {
  const evStart = addSegmentStart(eventRoot, seg, primary);
  addSegmentEnd(eventRoot, evStart, seg, primary);
  return evStart;
}

function eventUpdateEnd(eventRoot: LinkedList<Event>, ev: Node<Event>, end: Point) {
  // Slides an end backwards
  ev.other!.remove();
  ev.seg.end = end;
  ev.other!.pt = end;
  eventAdd(eventRoot, ev.other!, ev.pt);
}

function eventDivide(eventRoot: LinkedList<Event>, ev: Node<Event>, pt: Point) {
  const ns = copy(pt, ev.seg.end, ev.seg);
  eventUpdateEnd(eventRoot, ev, pt);
  return addSegment(eventRoot, ns, !!ev.primary);
}

function statusCompare(ev1: Node<Event>, ev2: Node<Event>) {
  const a1 = ev1.seg.start;
  const a2 = ev1.seg.end;
  const b1 = ev2.seg.start;
  const b2 = ev2.seg.end;

  if (!Point.colinear(a1, b1, b2)) return pointAboveOrOnLine(a1, b1, b2) ? 1 : -1;
  if (!Point.colinear(a2, b1, b2)) return pointAboveOrOnLine(a2, b1, b2) ? 1 : -1;
  return 1;
}

/** Returns the segment equal to ev1, or false if nothing equal. */
function checkIntersection(eventRoot: LinkedList<Event>, ev1: Node<Event>, ev2: Node<Event>) {
  const seg1 = ev1.seg;
  const seg2 = ev2.seg;
  const a1 = seg1.start;
  const a2 = seg1.end;
  const b1 = seg2.start;
  const b2 = seg2.end;

  const i = linesIntersect(a1, a2, b1, b2);

  if (i === false) {
    // Segments are parallel or coincident. If points aren't collinear, then
    // the segments are parallel, so no intersections. Otherwise, segments are
    // on top of each other somehow (aka coincident)
    if (!Point.colinear(a1, a2, b1)) return false;
    if (Point.equals(a1, b2) || Point.equals(a2, b1)) return false;

    const a1isb1 = Point.equals(a1, b1);
    const a2isb2 = Point.equals(a2, b2);

    if (a1isb1 && a2isb2) return ev2;  // Segments are exactly equal

    const a1Between = !a1isb1 && pointBetween(a1, b1, b2);
    const a2Between = !a2isb2 && pointBetween(a2, b1, b2);

    if (a1isb1) {
      a2Between ? eventDivide(eventRoot, ev2, a2) : eventDivide(eventRoot, ev1, b2);
      return ev2;
    } else if (a1Between) {
      if (!a2isb2) {
        a2Between ? eventDivide(eventRoot, ev2, a2) : eventDivide(eventRoot, ev1, b2);
      }
      eventDivide(eventRoot, ev2, a1);
    }

  } else {
    // Otherwise, lines intersect at i.pt, which may or may not be between the endpoints

    // Is A divided between its endpoints? (exclusive)
    if (i.alongA === 0) {
      if (i.alongB === -1) { // yes, at exactly b1
        eventDivide(eventRoot, ev1, b1);
      } else if (i.alongB === 0) { // yes, somewhere between B's endpoints
        eventDivide(eventRoot, ev1, i.pt);
      } else if (i.alongB === 1) { // yes, at exactly b2
        eventDivide(eventRoot, ev1, b2);
      }
    }

    // Is B divided between its endpoints? (exclusive)
    if (i.alongB === 0) {
      if (i.alongA === -1) { // yes, at exactly a1
        eventDivide(eventRoot, ev2, a1);
      } else if (i.alongA === 0) { // yes, somewhere between A's endpoints (exclusive)
        eventDivide(eventRoot, ev2, i.pt);
      } else if (i.alongA === 1) { // yes, at exactly a2
        eventDivide(eventRoot, ev2, a2);
      }
    }
  }
  return false;
}

function calculate(eventRoot: LinkedList<Event>, selfIntersection: boolean) {
  const statusRoot = new LinkedList<Status>();

  const segments = [];
  while (eventRoot.head) {
    const ev = eventRoot.head;

    if (ev.isStart) {
      const surrounding = statusRoot.findTransition((here) => statusCompare(ev, here.ev) > 0);
      const above = surrounding.before?.ev;
      const below = surrounding.after?.ev;

      // eslint-disable-next-line no-inner-declarations
      function checkBothIntersections() {
        if (above) {
          const eve = checkIntersection(eventRoot, ev, above);
          if (eve) return eve;
        }
        if (below) return checkIntersection(eventRoot, ev, below);
        return false;
      }

      const eve = checkBothIntersections();
      if (eve) {
        // ev and eve are equal: we'll keep eve and throw away ev

        if (selfIntersection) {
          // If we are a toggling edge, we merge two segments that belong to the
          // same polygon. Think of this as sandwiching two segments together,
          // where `eve.seg` is the bottom. This will cause the above fill flag to toggle
          const toggle = !ev.seg.myFill.below ? true : ev.seg.myFill.above !== ev.seg.myFill.below;
          if (toggle) eve.seg.myFill.above = !eve.seg.myFill.above;
        } else {
          // Merge two segments that belong to different polygons. Each segment
          // has distinct knowledge, so no special logic is needed note that
          // this can only happen once per segment in this phase, because we are
          // guaranteed that all self-intersections are gone.
          eve.seg.otherFill = ev.seg.myFill;
        }

        ev.other.remove();
        ev.remove();
      }

      // something was inserted before us in the event queue, so loop back around and
      // process it before continuing
      if (eventRoot.head !== ev) continue;

      // Calculate fill flags

      if (selfIntersection) {
        // We toggle an edge if if we are a new segment, or we are a segment
        // that has previous knowledge from a division
        const toggle = (!ev.seg.myFill.below) ? true : ev.seg.myFill.above !== ev.seg.myFill.below;

        // Calculate whether we are filled below us. If nothing is below us, we
        // are not filled below. Otherwise, the answer is the same if whatever
        // is below us is filled above it.
        ev.seg.myFill.below = !below ? false : below.seg.myFill.above;

        // since now we know if we're filled below us, we can calculate whether
        // we're filled above us by applying toggle to whatever is below us
        ev.seg.myFill.above = toggle ? !ev.seg.myFill.below : ev.seg.myFill.below;

      } else if (ev.seg.otherFill === undefined) {
        // If we don't have other information, we need to figure out if we're
        // inside the other polygon. If nothing is below us, then we're
        // outside. Otherwise copy the below segment's other polygon's above.
        const inside = !below ? false : (ev.primary === below.primary) ? below.seg.otherFill.above : below.seg.myFill.above;
        ev.seg.otherFill = {above: inside, below: inside};
      }

      // Insert the status and remember it for later removal
      ev.other.status = surrounding.insert(LinkedList.node({ev}));

    } else {
      const st = ev.status;
      if (st === undefined) throw new Error('[Euclid.js] Zero-length segment detected!');

      // Removing the status will create two new adjacent edges, so we'll need
      // to check for those.
      if (statusRoot.exists(st.prev) && statusRoot.exists(st.next)) {
        checkIntersection(eventRoot, st.prev.ev, st.next.ev);
      }

      st.remove();

      // Now we've calculated everything, so save the segment for reporting.
      if (!ev.primary) {
        const s = ev.seg.myFill;  // Make sure `seg.myFill` points to the primary polygon.
        ev.seg.myFill = ev.seg.otherFill;
        ev.seg.otherFill = s;
      }
      segments.push(ev.seg);
    }

    eventRoot.head.remove();
  }

  return segments;
}


// -----------------------------------------------------------------------------
// Segment Chainer

function segmentChainer(segments: Segment[]) {
  const chains: Point[][] = [];
  const regions: Point[][] = [];

  segments.forEach((seg) => {
    const pt1 = seg.start;
    const pt2 = seg.end;
    if (Point.equals(pt1, pt2)) return;  // Zero-length segment: maybe PRECISION is too small or too large!

    // Search for two chains that this segment matches.
    const firstMatch = {index: 0, matchesHead: false, matchesPt1: false};
    const secondMatch = {index: 0, matchesHead: false, matchesPt1: false};

    // TODO Better types without any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let nextMatch: any = firstMatch;

    function setMatch(index: number, matchesHead: boolean, matchesPt1: boolean) {
      nextMatch.index = index;
      nextMatch.matchesHead = matchesHead;
      nextMatch.matchesPt1 = matchesPt1;
      const match = nextMatch === firstMatch;
      nextMatch = match ? secondMatch : undefined;
      return !match;
    }

    for (let i = 0; i < chains.length; i++) {
      const chain = chains[i];
      const head = chain[0];
      const tail = last(chain);
      if (Point.equals(head, pt1)) {
        if (setMatch(i, true, true)) break;
      } else if (Point.equals(head, pt2)) {
        if (setMatch(i, true, false)) break;
      } else if (Point.equals(tail, pt1)) {
        if (setMatch(i, false, true)) break;
      } else if (Point.equals(tail, pt2)) {
        if (setMatch(i, false, false)) break;
      }
    }

    if (nextMatch === firstMatch) {
      // We didn't match anything, so create a new chain.
      chains.push([pt1, pt2]);
      return;
    }

    if (nextMatch === secondMatch) {
      // We matched a single chain. Add the other point to the appropriate end,
      // and check to see if we've closed the chain into a loop.

      const index = firstMatch.index;
      const pt = firstMatch.matchesPt1 ? pt2 : pt1;
      const addToHead = firstMatch.matchesHead;

      const chain = chains[index];
      let grow = addToHead ? chain[0] : chain[chain.length - 1];
      const grow2 = addToHead ? chain[1] : chain[chain.length - 2];
      const oppo = addToHead ? chain[chain.length - 1] : chain[0];
      const oppo2 = addToHead ? chain[chain.length - 2] : chain[1];

      if (Point.colinear(grow2, grow, pt)) {
        // Grow isn't needed because it's directly between grow2 and pt.
        addToHead ? chain.shift() : chain.pop();
        grow = grow2; // Old grow is gone... new grow is what grow2 was.
      }

      if (Point.equals(oppo, pt)) {
        // We're closing the loop, so remove chain from chains.
        chains.splice(index, 1);

        if (Point.colinear(oppo2, oppo, grow)) {
          // Oppo isn't needed because it's directly between oppo2 and grow.
          addToHead ? chain.pop() : chain.shift();
        }

        regions.push(chain);
        return;
      }

      // Not closing a loop, so just add it to the appropriate side.
      addToHead ? chain.unshift(pt) : chain.push(pt);
      return;
    }

    // Otherwise, we matched two chains, so we need to combine those chains together.

    function reverseChain(index: number) {
      chains[index].reverse();
    }

    function appendChain(index1: number, index2: number) {
      // index1 gets index2 appended to it, and index2 is removed
      const chain1 = chains[index1];
      const chain2 = chains[index2];
      let tail = chain1[chain1.length - 1];
      const tail2 = chain1[chain1.length - 2];
      const head = chain2[0];
      const head2 = chain2[1];

      if (Point.colinear(tail2, tail, head)) {
        // Tail isn't needed because it's directly between tail2 and head
        chain1.pop();
        tail = tail2; // old tail is gone... new tail is what tail2 was
      }

      if (Point.colinear(tail, head, head2)) {
        // Head isn't needed because it's directly between tail and head2
        chain2.shift();
      }

      chains[index1] = chain1.concat(chain2);
      chains.splice(index2, 1);
    }

    const F = firstMatch.index;
    const S = secondMatch.index;

    const reverseF = chains[F].length < chains[S].length;  // Reverse the shorter chain
    if (firstMatch.matchesHead) {
      if (secondMatch.matchesHead) {
        if (reverseF) {
          reverseChain(F);
          appendChain(F, S);
        } else {
          reverseChain(S);
          appendChain(S, F);
        }
      } else {
        appendChain(S, F);
      }
    } else {
      if (secondMatch.matchesHead) {
        appendChain(F, S);
      } else {
        if (reverseF) {
          reverseChain(F);
          appendChain(S, F);
        } else {
          reverseChain(S);
          appendChain(F, S);
        }
      }
    }
  });

  return regions;
}


// -----------------------------------------------------------------------------
// Workflow

function select(segments: Segment[], selection: number[]) {
  const result: Segment[] = [];

  for (const seg of segments) {
    const index = (seg.myFill.above ? 8 : 0) +
                  (seg.myFill.below ? 4 : 0) +
                  ((seg.otherFill && seg.otherFill.above) ? 2 : 0) +
                  ((seg.otherFill && seg.otherFill.below) ? 1 : 0);
    if (selection[index] !== 0) {
      result.push({
        start: seg.start,
        end: seg.end,
        myFill: {above: selection[index] === 1, below: selection[index] === 2}
      });
    }
  }

  return result;
}

function segments(poly: MultiPolygon) {
  const root = new LinkedList<Event>();

  for (const region of poly) {
    for (let i = 0; i < region.length; i++) {
      const pt1 = i ? region[i - 1] : last(region);
      const pt2 = region[i];

      const forward = pointsCompare(pt1, pt2);
      if (forward === 0) continue; // skip zero-length segments

      const start = forward < 0 ? pt1 : pt2;
      const end = forward < 0 ? pt2 : pt1;
      addSegment(root, {start, end, myFill: {}}, true);
    }
  }

  return calculate(root, true);
}

function operate(poly1: MultiPolygon, poly2: MultiPolygon, selection: number[]) {
  const root = new LinkedList<Event>();
  for (const s of segments(poly1)) addSegment(root, copy(s.start, s.end, s), true);
  for (const s of segments(poly2)) addSegment(root, copy(s.start, s.end, s), false);

  const results = select(calculate(root, false), selection);
  return segmentChainer(results);
}


// -----------------------------------------------------------------------------
// Public Exports

type MultiPolygon = Point[][];

const UNION = [0, 2, 1, 0, 2, 2, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0];
const INTERSECT = [0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 1, 1, 0, 2, 1, 0];
const DIFFERENCE = [0, 0, 0, 0, 2, 0, 2, 0, 1, 1, 0, 0, 0, 1, 2, 0];
const XOR = [0, 2, 1, 0, 2, 0, 0, 1, 1, 0, 0, 2, 0, 1, 2, 0];

export const union = (p1: MultiPolygon, p2: MultiPolygon) => operate(p1, p2, UNION);
export const intersect = (p1: MultiPolygon, p2: MultiPolygon) => operate(p1, p2, INTERSECT);
export const difference = (p1: MultiPolygon, p2: MultiPolygon) => operate(p1, p2, DIFFERENCE);
export const xor = (p1: MultiPolygon, p2: MultiPolygon) => operate(p1, p2, XOR);
