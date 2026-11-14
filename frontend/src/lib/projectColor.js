// Each project gets one of six muted colors for its dot. The color has no meaning;
// it only helps tell projects apart. Tomato is never used, so urgency stays clear.
const DOTS = 6

export function projectColor(projectId) {
  return `var(--dot-${(Number(projectId) % DOTS) + 1})`
}
