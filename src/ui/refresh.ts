// One place to ask for a redraw. The app registers the real renderer at startup,
// which keeps the story and AI modules free of any screen code.
let renderer: () => void = () => {};
export function setRenderer(fn: () => void) { renderer = fn; }
export function render() { renderer(); }
