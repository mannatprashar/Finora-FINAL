# Finora — Multimodal 3D Experience Update

This build keeps the chatbot as the primary product surface and reshapes the website around it.

## What changed
- Removed the creator/about section and the standalone closing marketing section.
- Removed the redundant manifesto/intro sections so the experience gets to the copilot faster.
- Made the chatbot the central hero of the experience after the 3D opening.
- Added explicit product language for the four intelligence layers:
  - LLM — Think / reason
  - LIM — Create / visualize
  - LVM — See / understand visual inputs
  - Voice/TTS — Speak the answer
- Added a scroll-driven 3D-style intelligence journey where the four layers enter from depth and assemble around the Finora core.
- Added per-answer browser speech controls to the chatbot.
- Shifted the visual grade toward the warm charcoal / cream / muted olive / burnt-orange Lusion-inspired direction.
- Preserved the existing Flask, Pinecone/RAG, Groq chat and financial playground code.

## Important implementation note
The current backend in this project exposes the working text/RAG/chat and finance APIs. The new LIM/LVM labels are the product architecture/UI for those future multimodal adapters; they are not presented as a fake working image-generation or vision API. Voice uses the browser's SpeechSynthesis API.

## Run
Frontend:
  cd frontend
  npm install
  npm run dev

Backend:
  cd backend
  py app.py
