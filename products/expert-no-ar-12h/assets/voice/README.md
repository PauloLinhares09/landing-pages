# Voice — Expert no Ar 12H (LT67)

Runtime assets for the LP (deploy with `assets/`).

| Arquivo | Uso |
|---------|-----|
| `vsl-ena12h-lt67-5min.mp3` | Áudio VSL FAB (~5:16) |
| `vsl-ena12h-lt67-5min.elevenlabs.md` | Script ElevenLabs (seção C → regenerate) |
| `aula-m01-01-bem-vindo.mp3` | Áudio aula 1.1 (~4:15) — fonte ElevenLabs |
| `aula-m01-01-bem-vindo.mp4` | Player Hotmart: thumb estática 16:9 + áudio (~4:15) |
| `aula-m01-01-bem-vindo.elevenlabs.md` | Script ElevenLabs da aula 1.1 |
| `aula-m08-01-caminho-ate-o-mercado.mp3` | Áudio aula 8.1 (~3:51) — fonte ElevenLabs |
| `aula-m08-01-caminho-ate-o-mercado.mp4` | Player Hotmart: thumb 8.1 + áudio (~3:51) |
| `aula-m08-01-caminho-ate-o-mercado.elevenlabs.md` | Script ElevenLabs da aula 8.1 |
| `aula-m08-02-tudo-incluido.mp3` | Áudio aula 8.2 (~5:25) — fonte ElevenLabs |
| `aula-m08-02-tudo-incluido.mp4` | Player Hotmart: thumb 8.2 + áudio (~5:25) |
| `aula-m08-02-tudo-incluido.elevenlabs.md` | Script ElevenLabs da aula 8.2 |
| `aula-m08-03-a-decisao.mp3` | Áudio aula 8.3 (~5:28) — fonte ElevenLabs |
| `aula-m08-03-a-decisao.mp4` | Player Hotmart: thumb 8.3 + áudio (~5:28) |
| `aula-m08-03-a-decisao.elevenlabs.md` | Script ElevenLabs da aula 8.3 |

**Formato “áudio como vídeo”:** banner da aula em canvas 1920×1080 + track AAC. O aluno vê player de vídeo; o fundo é a imagem; o áudio toca.

**LP paths:** `./assets/voice/…` · poster: `./assets/ena12h-hotmart-cover-600.jpg`  
**SSOT copy VSL:** `../../copy/VSL_copy_ena12h_lt67_5min.md`  
**SSOT 1.1:** `…/m01-01-bem-vindo-hoje-seu-conhecimento-comeca-a-virar-produto.html` · Hotmart `o4EWAnz97z` · M1 `k45ZQRkqel`  
**SSOT 8.1:** `…/m08-01-…` · Hotmart `ROxd6x8xOD` · M8 `3eajQZ0k7g`  
**SSOT 8.2:** `…/m08-02-tudo-o-que-esta-incluido-e-tudo-o-que-precisamos-de-voce.html` · Hotmart `r48lNQ634R` · product `8216218`  
**SSOT 8.3:** `…/m08-03-a-decisao-receber-seu-produto-ou-ativar-sua-operacao.html` · Hotmart `2OMkLzWye6` · M8 `3eajQZ0k7g`

## Regenerar

```bash
cd package-source/fl-tools/elevenlabs

# VSL
node generate.mjs ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/vsl-ena12h-lt67-5min.elevenlabs.md
cp output/vsl-ena12h-lt67-5min.mp3 \
  ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/

# Aula 1.1 — áudio
node generate.mjs ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/aula-m01-01-bem-vindo.elevenlabs.md
cp output/aula-m01-01-bem-vindo.mp3 \
  ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/

# Aula 1.1 — MP4 (thumb + áudio) para Hotmart Player
VOICE=../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice
IMG=../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/ena12h-aula-1-1-seu-conhecimento-comeca-a-virar-produto.png
DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VOICE/aula-m01-01-bem-vindo.mp3")
ffmpeg -y -loop 1 -i "$IMG" -i "$VOICE/aula-m01-01-bem-vindo.mp3" -t "$DUR" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x030508,format=yuv420p,fps=24" \
  -c:v libx264 -tune stillimage -preset medium -crf 18 \
  -c:a aac -b:a 192k -ac 2 -shortest -movflags +faststart \
  "$VOICE/aula-m01-01-bem-vindo.mp4"

# Aula 8.1 — áudio + MP4
node generate.mjs ../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/voice/aula-m08-01-caminho-ate-o-mercado.elevenlabs.md
cp output/aula-m08-01-caminho-ate-o-mercado.mp3 "$VOICE/"
IMG8=../../../../experts/expert-no-ar-12h/raiz/low-tickets/expert-no-ar-12h-lt67/assets/ena12h-aula-8-1-seu-produto-existe-agora-o-caminho-ate-o-mercado.png
DUR8=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VOICE/aula-m08-01-caminho-ate-o-mercado.mp3")
ffmpeg -y -loop 1 -i "$IMG8" -i "$VOICE/aula-m08-01-caminho-ate-o-mercado.mp3" -t "$DUR8" \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x030508,format=yuv420p,fps=24" \
  -c:v libx264 -tune stillimage -preset medium -crf 18 \
  -c:a aac -b:a 192k -ac 2 -shortest -movflags +faststart \
  "$VOICE/aula-m08-01-caminho-ate-o-mercado.mp4"
```
