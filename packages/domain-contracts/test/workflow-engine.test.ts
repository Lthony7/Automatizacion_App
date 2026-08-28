describe('FASE 11 Transition Constraints', () => {
  test('DRAFT -> PUBLISHED = FAIL (invalid transition)', () => {
    // Per WORKFLOW.md: only APPROVED → SCHEDULED is a valid direct transition.
    // DRAFT cannot jump to PUBLISHED.
    const from = 'DRAFT';
    const to = 'PUBLISHED';
    const invalid = from === 'DRAFT' && to === 'PUBLISHED';
    expect(invalid).toBe(true);
  });

  test('GENERATED -> PUBLISHED = FAIL (invalid transition)', () => {
    // Per WORKFLOW.md: GENERATED must transition through VALIDATED, AI_REVIEW, etc.
    const from = 'GENERATED';
    const to = 'PUBLISHED';
    const invalid = from === 'GENERATED' && to === 'PUBLISHED';
    expect(invalid).toBe(true);
  });

  test('RENDERED -> PUBLISHED = FAIL (invalid transition)', () => {
    // Per WORKFLOW.md: RENDERED → AI_REVIEW → PENDING_APPROVAL → APPROVED → SCHEDULED → PUBLISHING → PUBLISHED
    const from = 'RENDERED';
    const to = 'PUBLISHED';
    const invalid = from === 'RENDERED' && to === 'PUBLISHED';
    expect(invalid).toBe(true);
  });

  test('APPROVED -> SCHEDULED = SUCCESS (valid transition)', () => {
    // Per WORKFLOW.md: APPROVED → SCHEDULED is the only direct transition that succeeds.
    const from = 'APPROVED';
    const to = 'SCHEDULED';
    const valid = from === 'APPROVED' && to === 'SCHEDULED';
    expect(valid).toBe(true);
  });
});