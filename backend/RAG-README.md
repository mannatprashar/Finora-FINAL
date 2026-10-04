# Finora retrieval pipeline

- `knowledge_base.json`: bundled financial-education passages and source metadata.
- `rag.py`: dependency-free lexical TF-IDF-style retrieval and citation ID assignment.
- `POST /api/chat`: retrieves passages, passes them into AI mode, or returns a source-grounded demo answer.
- `GET /api/knowledge/sources`: lists bundled source records.
- Frontend: renders `[S1]` markers as links and displays the matching retrieved passage.

The initial corpus is intentionally small. Review/replace the summaries with approved source text and stable deep links before production. Similarity ranking is a retrieval aid, not proof that a source supports every generated sentence.
