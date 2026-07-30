# Voice — Expert no Ar 12H (LT67)

Runtime assets for the LP (deploy with `assets/`).

| Arquivo | Uso |
|---------|-----|
| `vsl-ena12h-lt67-5min.mp3` | Áudio VSL FAB (~5:16) |
| `vsl-ena12h-lt67-5min.elevenlabs.md` | Script ElevenLabs (seção C → regenerate) |

**LP paths:** `./assets/voice/…` · poster: `./assets/ena12h-hotmart-cover-600.jpg`  
**SSOT copy:** `../../copy/VSL_copy_ena12h_lt67_5min.md`

## Regenerar

```bash
cd package-source/fl-tools/elevenlabs
node generate.mjs ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/vsl-ena12h-lt67-5min.elevenlabs.md
cp output/vsl-ena12h-lt67-5min.mp3 \
  ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/
```
