# LT38 landing-page versions

## Canonical

- File: `LT_como_mapear_sua_operacao.html`
- Purpose: original production landing page
- Backup ref: `backup/lt38-original-pre-lite`
- Immutable commit: `0fa3dd5aadba89c059374b2908957498945b3b0c`

## LP-Lite V2

- File: `LT_como_mapear_sua_operacao_v2.html`
- Purpose: additional lightweight mobile-first variant
- Search policy: `noindex`; canonical remains the original URL
- Backup ref: `backup/lt38-lite-v1`
- Immutable merge commit: `ed7904360808bdd5eb3e0d954fa2c51b3c119f8a`

## Change policy

Never replace the canonical LT38 page with an experiment.

For future variants:

1. create an immutable backup ref before editing;
2. create a new versioned file;
3. keep the canonical file unchanged;
4. validate tracking and checkout isolation;
5. switch campaign destinations only after explicit human approval.
