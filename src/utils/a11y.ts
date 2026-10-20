import type { Result } from 'axe-core';

/** WCAG 2.1 A + AA: the usual legal/compliance bar. */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/** One line per offending node, readable in the HTML report and CI logs. */
export function formatViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `    - ${node.target.join(' ')}`).join('\n');
      return `[${violation.impact ?? 'n/a'}] ${violation.id}: ${violation.help}\n  ${violation.helpUrl}\n${nodes}`;
    })
    .join('\n\n');
}
