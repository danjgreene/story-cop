// Canned answers for the fake Claude used in the parity test. Each answer is
// picked by looking at which task the prompt asks for.
const J = (x: any) => JSON.stringify(x);

export function respond(prompt: string): string {
  const task = prompt.split('\n\nTASK:\n')[1] || '';

  if (task.startsWith('The writer is pitching a new movie.')) return J({
    read: 'A cheapskate\'s refusal to commit is the engine: every free thing costs him more.',
    frame: { genre: 'Comedy', genre2: 'Crime', blend: 60, tone: 'Darkly comic', rating: 'R', runtime: 100, structure: 'save-the-cat' },
    questions: [
      { id: 'k1', q: 'Who signs the paperwork?', options: [{ label: 'Gary', note: 'He signs everything; it\'s his flaw.' }, { label: 'Donna', note: 'She finally gives in.' }, { label: 'Both', note: 'A shared mistake.' }] },
      { id: 'k2', q: 'Who runs the ring?', options: [{ label: 'Hackers', note: 'Nerds with a mesh network.' }, { label: 'Mobsters', note: 'Classic muscle.' }, { label: 'A bank', note: 'Respectable crooks.' }] },
      { id: 'k3', q: 'How do the feds see them?', options: [{ label: 'Masterminds', note: 'Wrong-man comedy.' }, { label: 'Victims', note: 'Allies.' }, { label: 'Ignored', note: 'Alone.' }] },
      { id: 'k4', q: 'What do they lose?', options: [{ label: 'The house', note: 'Stakes.' }, { label: 'The circuit', note: 'Community.' }, { label: 'Each other', note: 'The marriage.' }] },
      { id: 'k5', q: 'A fifth question that should be dropped', options: [] },
    ],
  });

  if (task.includes('Build the first development pass.')) return J({
    title: 'Last Resort', logline: 'Two freebie hunters accidentally own a crime ring.', tone: 'Darkly comic', runtime: 100,
    spine: [{ k: 'GARY WANTS', v: 'Something for nothing.' }, { k: 'GARY NEEDS', v: 'To commit.' }, { k: 'THEME', v: 'Nothing is free.' }],
    movements: [
      { title: 'The Circuit', time: '0–30', summary: 'Pros at the game.', feel: 'charmed', beats: [{ n: 1, t: 'Cold open at a timeshare.' }, { n: 2, t: 'Polly\'s tip.' }] },
      { title: 'North', time: '30–70', summary: 'Road trip.', feel: 'dread', beats: [{ n: 3, t: 'MIDPOINT: They own it all.' }] },
      { title: 'Paid in Full', time: '70–100', summary: 'The sting.', feel: 'warmth', beats: [{ n: 4, t: 'FINAL IMAGE: Gary says no.' }] },
    ],
    locked: ['Gary signs everything', 'The ring is a polite Canadian hacker collective'],
    rolled: ['The feds think they are masterminds', 'They risk losing each other'],
    open: [
      { q: 'What clause gives them leverage?', job: 'Beat hackers with paper.', affects: 'Affects beats 3, 4' },
      { q: 'Who leads the ring?', job: 'Make it personal.', affects: 'Affects beat 2' },
      { q: 'What does Gary pay with?', job: '', affects: '' },
    ],
    ledger: [{ at: 'Beat 2: Polly\'s tip', aud: 'A favor', them: 'A favor' }],
    proposed: 'Polly recruited them on purpose.',
  });

  if (task.startsWith('Check the beat sheet against')) return J({
    items: [{ beat: 'Catalyst', n: 2, status: 'ok', note: 'Polly\'s tip lands on time.' }, { beat: 'Midpoint', n: 3, status: 'late', note: 'It comes too late.' }, { beat: 'All Is Lost', n: null, status: 'missing', note: 'There is no low point.' }, { beat: 'Debate', n: 1, status: 'bogus', note: '' }],
    summary: 'The bones are there but the low point is missing.',
  });

  if (task.startsWith('Open question (id ')) return J({
    job: 'Give them leverage without hacking or luck.',
    options: [
      { label: 'The fine print clause', text: 'A clause makes any merger need both owners in person.', gain: 'Uses the paperwork.', cost: 'Talky.' },
      { label: 'The cooling-off period', text: 'Ontario law lets them cancel within 10 days.', gain: 'Simple.', cost: 'Too easy.' },
      { label: 'The free gift', text: 'The TV itself is the leverage.', gain: 'Ironic.', cost: 'Gadgety.' },
    ],
    pick: { index: 0, why: 'It turns his flaw into the weapon.' },
  });

  if (task.startsWith('The writer\'s latest message')) return J({
    reply: 'Donna signing flips the marriage.\n\nIt also means she read it.',
    changes: [{ kind: 'lock', text: 'Donna signs instead of Gary', resolves: '' }, { kind: 'kill', text: 'The TV hides drugs', resolves: '' }, { kind: 'lock', text: '' }],
    affects: 'Movement 2, beat 3',
  });

  if (task.startsWith('The writer doesn\'t know, and is handing these open questions to you (roll the dice)')) {
    const ids = [...task.matchAll(/^- id (\w+):/gm)].map((m) => m[1]);
    const flavor = task.includes('THEIR NOTE:') ? ' (steered)' : task.includes('passed on these earlier spins') ? ' (another spin)' : '';
    return J({ fills: [...ids.map((id) => ({ id, text: 'A committed answer for ' + id + flavor + '.' })), { id: 'not-a-real-id', text: 'dropped' }], connection: 'They all cost Gary money' + flavor + '.' });
  }

  if (task.startsWith('Zoom out. Regenerate')) return J({
    logline: 'Two freebie hunters own a crime ring and have to pay full price to get out.', tone: 'Darkly comic', runtime: 105,
    spine: [{ k: 'GARY WANTS', v: 'Something for nothing.' }, { k: 'DONNA WANTS', v: 'A real vacation.' }],
    movements: [
      { title: 'The Circuit', time: '0–30', summary: 'Pros.', feel: 'charmed', beats: [{ n: 1, t: 'Cold open.' }] },
      { title: 'North', time: '30–70', summary: 'Donna signs.', feel: 'dread', beats: [{ n: 2, t: 'Donna signs.' }] },
      { title: 'Paid in Full', time: '70–105', summary: 'Sting.', feel: 'warmth', beats: [{ n: 3, t: 'FINAL IMAGE: Paid in full.' }] },
    ],
    ledger: [],
    changed: ['Donna signs now', 'Runtime is 105'],
  });

  if (task.startsWith('Break the beats into a scene list')) return J({
    scenes: [
      { n: 1, m: 1, slug: 'INT. TIMESHARE - DAY', does: 'They win vouchers.' },
      { n: 2, m: 2, slug: 'EXT. HIGHWAY - DAY', does: 'Donna signs.' },
      { n: 3, m: 2, slug: 'INT. MOTEL - NIGHT', does: '' },
      { n: 4, m: 3, slug: 'INT. FEDERAL BUILDING - DAY', does: 'The sting.' },
    ],
  });

  if (task.startsWith('Write the screenplay pages for movement')) {
    const m = /movement (\d+)/.exec(task)[1];
    return '```fountain\nINT. TIMESHARE - DAY\n\nGary folds his arms. Movement ' + m + '.\n\nGARY\n(to Donna)\nHe\'s going to be honest with us.\n\nCUT TO:\n```';
  }

  if (task.startsWith('The writer imported an existing screenplay')) return J({
    title: 'The Revisionist', logline: 'A historian edits the past.', tone: 'Paranoid', runtime: 95,
    spine: [{ k: 'CASSIAN WANTS', v: 'A better past.' }],
    movements: [
      { title: 'Edits', time: '0–50', summary: 'He edits.', feel: 'unease', beats: [{ n: 1, t: 'He edits a book.' }] },
      { title: 'Erased', time: '50–95', summary: 'He is edited.', feel: 'terror', beats: [{ n: 2, t: 'His name is gone.' }] },
    ],
    locked: ['Cassian can change history by editing books'],
    open: [{ q: 'Who else can edit?', job: 'Raise the stakes.', affects: 'Affects beat 2' }],
    ledger: [],
    frame: { genre: 'Thriller', genre2: '', blend: 70, tone: 'Paranoid', rating: 'PG-13', runtime: 95, structure: 'five-act' },
    diagnosis: 'Strong hook, thin middle.',
    movementStarts: ['INT. ARCHIVE - NIGHT', 'INT. CASSIAN\'S APARTMENT - NIGHT'],
  });

  return '{}';
}
