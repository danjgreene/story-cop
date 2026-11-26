// The test story: Last Resort (the built-in sample) with screenplay pages,
// a scene list and an author, built with fixed ids so every run is identical.
// The pages deliberately hit every screenplay element and the tricky cases:
// forced headings and characters, extensions, parentheticals, transitions,
// centered text, emphasis marks, curly quotes and dashes, XML characters,
// accented letters, long lines that wrap, and enough length for several PDF pages.
import { SEED } from '../../src/story/samples';
import type { Story } from '../../src/story/types';

const M1 = `INT. BRANSON TIMESHARE RESORT - SALES FLOOR - DAY

A carpeted room the color of weak tea. Twelve round tables. A banner: “PARADISE IS CLOSER THAN YOU THINK.”

GARY PRUITT (60s, windbreaker, a pen behind each ear) sits with his arms folded. DONNA PRUITT (60s) eats a complimentary danish with surgical focus.

CHAD (30s, teeth) slides a brochure across the table.

CHAD
Folks, I'm going to be honest with you.

GARY
(to Donna)
He's going to be honest with us.

DONNA
That's nice. Nobody's honest anymore.

CHAD
This offer — and I mean this — expires when you walk out that door.

Gary checks his watch. He clicks one pen. Then the other.

GARY
Chad. Can I call you Chad?

CHAD
It's my name.

GARY
Chad, we've toured forty-one properties in nineteen states. We have walked out of every door you can imagine. Revolving doors. Sliding doors. A door in Gatlinburg that was painted on a wall.

DONNA (O.S.)
That one was a fire exit.

Donna is suddenly at the coffee station, filling a thermos from the urn.

GARY
The vouchers, Chad.

A long beat. Chad's smile does not move but something behind it dies.

CUT TO:

EXT. RESORT PARKING LOT - CONTINUOUS

Gary and Donna walk to a 2004 Buick LeSabre with a cruise voucher each, fanned like winning cards. The vouchers are blacked out for every date that matters.

DONNA
These are blacked out through 2031.

GARY
Then we'll go in 2032.

.FLASHBACK - THE PRUITT GARAGE - NIGHT

!A wall of unopened boxes, floor to ceiling: blenders, a karaoke machine, six identical "spa" robes & a canoe.

@McKINLEY
(muffled, from inside a box)
Is somebody there?

> FADE TO:

INT. PRUITT KITCHEN - MORNING

Donna slides an AMALFI COAST brochure out of a cookbook, looks at it… and slides it back.

> THE END OF THE BEGINNING <
`;

const M2 = `EXT. ONTARIO HIGHWAY - DAY

The Buick crawls along a gravel detour. A sign: TOLL BRIDGE 3 KM. Gary swerves onto a dirt road.

DONNA
That was six dollars, Gary. Six.

GARY
It's the principle, Donna.

DONNA
(quietly)
It's always the principle.

INT. NORTHERN PINES RESORT - LOBBY - DAY

Empty. Echoing. KYLE (20s, sweat stains shaped like continents) waves them in with both arms.

KYLE
Welcome! Welcome to Northern Pines, where every season is <the season> & every guest is "family."

He hands Gary a stack of contracts thick enough to stop a door. Gary signs each page without looking, the way other men breathe.

KYLE (CONT'D)
You don't — I mean you could read those. People read those.

GARY
Nobody reads those, Kyle.

Donna looks up from her danish. She looks at Kyle. Kyle looks away first.

SMASH CUT TO:

EXT. RESORT LOADING DOCK - LATER

An 85-INCH TELEVISION in its box leans against the Buick, which is roughly the same size as the box.

Gary and Donna stand with their hands on their hips, studying the problem like surveyors. This action line is long on purpose so that it wraps across several lines in the PDF and the Word file and the Final Draft file, and keeps going until it has to wrap at least three times to prove the wrapping code is right.

GARY
It'll fit.

DONNA
It will not fit.

GARY
Everything fits if you believe in it.
`;

const M4 = `INT. MOTEL ROOM - NIGHT

The TV, unboxed, fills an entire wall. Its standby light pulses like a heartbeat. Gary sleeps. Donna does not.

At 3:00 A.M. the screen wakes by itself. A soft blue glow. Then text: HELLO, MR. PRUITT.

DONNA
Gary.

GARY
(asleep)
Bonus feature.

The router on the dresser lights up like a pinball machine.

INT. FEDERAL BUILDING - INTERROGATION ROOM - DAY

AGENT HALVORSEN (50s, crew cut, a tie clip shaped like a tiny handcuff) spreads forty corporate filings across the table like a winning poker hand.

HALVORSEN
Pruitt Holdings. Pruitt Logistics. Pruitt Café & Bakery — é, with the little hat. Very classy.

GARY
I've never been to a café in my life.

HALVORSEN
(leaning in)
That's exactly what a mastermind would say.
`;

export function testStory(): Story {
  const s = JSON.parse(JSON.stringify(SEED));
  return {
    id: 'teststory1',
    title: s.title,
    logline: s.logline,
    tone: s.tone,
    runtime: s.runtime,
    spine: s.spine,
    movements: s.movements,
    locked: [
      ...s.locked.map((t, i) => ({ id: 'l' + i, text: t, by: 'you' })),
      { id: 'lr1', text: 'The muscle: a retired hockey enforcer who now works as a mall Santa', by: 'ai' },
    ],
    open: s.open.map((o, i) => ({ id: 'o' + i, q: o.q, job: o.job, affects: o.affects })),
    dead: s.dead,
    ledger: s.ledger,
    scenes: [
      { n: 1, m: 1, slug: 'INT. BRANSON TIMESHARE RESORT - SALES FLOOR - DAY', does: 'They break Chad and walk out with vouchers.' },
      { n: 2, m: 1, slug: 'EXT. RESORT PARKING LOT - CONTINUOUS', does: 'The vouchers are blacked out.' },
      { n: 3, m: 2, slug: 'INT. NORTHERN PINES RESORT - LOBBY - DAY', does: 'Gary signs everything; Kyle almost warns them.' },
      { n: 4, m: 4, slug: 'INT. MOTEL ROOM - NIGHT', does: '' },
    ],
    pages: { 1: M1, 2: M2, 4: M4 },
    chat: [{ who: 'editor', text: 'Welcome back.' }, { who: 'you', text: 'Make Polly funnier.' }],
    stale: false,
    version: 7,
    history: [],
    reviewed: { spine: true, movements: true, beats: true },
    seenGuide: true,
    frame: s.frame,
    author: 'Dan Greene & “Friends”',
  };
}
