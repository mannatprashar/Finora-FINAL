"""Upload Finora knowledge into the existing Pinecone index.

Bundled passages in knowledge_base.json keep their current ids.
PDFs placed in knowledge_pdfs/ are chunked and upserted with stable ids,
so running this script again replaces those same records instead of duplicating them.
"""
import hashlib
import os
from pathlib import Path

from dotenv import load_dotenv
from pypdf import PdfReader

from rag import load_documents

BACKEND_DIR = Path(__file__).resolve().parent
PDF_DIR = BACKEND_DIR / "knowledge_pdfs"
CHUNK_SIZE = 1100
CHUNK_OVERLAP = 120
UPSERT_BATCH = 40

# Public page for the bundled open textbook. Other PDFs keep a non-navigating link
# so retrieval still accepts them; page numbers stay in metadata.
KNOWN_URLS = {
    "financial management for small businesses": "https://openbooks.lib.msu.edu/financialmanagement/",
}


def chunk_page(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    cleaned = " ".join((text or "").split())
    if len(cleaned) < 40:
        return []
    if len(cleaned) <= size:
        return [cleaned]
    parts = []
    start = 0
    while start < len(cleaned):
        end = min(len(cleaned), start + size)
        if end < len(cleaned):
            space = cleaned.rfind(" ", start + size // 2, end)
            if space != -1:
                end = space
        piece = cleaned[start:end].strip()
        if len(piece) >= 40:
            parts.append(piece)
        if end >= len(cleaned):
            break
        start = max(end - overlap, start + 1)
    return parts


def pdf_record_id(filename: str, page: int, chunk_index: int) -> str:
    digest = hashlib.sha256(filename.encode("utf-8")).hexdigest()[:12]
    return f"pdf-{digest}-p{page:04d}-c{chunk_index:03d}"


def pdf_records(path: Path, text_field: str) -> list[dict]:
    reader = PdfReader(str(path))
    meta = reader.metadata
    title = str(getattr(meta, "title", None) or path.stem).strip() or path.stem
    authors = str(getattr(meta, "author", None) or "Finance PDF").strip()
    url = KNOWN_URLS.get(title.lower(), "#")
    records = []
    for index, page in enumerate(reader.pages):
        page_number = index + 1
        for chunk_index, text in enumerate(chunk_page(page.extract_text() or "")):
            chunk_id = pdf_record_id(path.name, page_number, chunk_index)
            records.append({
                "_id": chunk_id,
                text_field: text,
                "title": path.name,
                "publisher": authors,
                "section": f"Page {page_number}",
                "url": url,
                "source": path.name,
                "page": page_number,
                "chunk_id": chunk_id,
                "document_type": "finance",
                "topic": title,
            })
    return records


def bundled_records(text_field: str) -> list[dict]:
    records = []
    for doc in load_documents():
        records.append({
            "_id": str(doc["id"]),
            text_field: str(doc["text"]),
            "title": str(doc.get("title", "Financial education source")),
            "publisher": str(doc.get("publisher", "Source publisher")),
            "section": str(doc.get("section", "")),
            "url": str(doc["url"]),
        })
    return records


def upsert_batches(index, namespace: str, records: list[dict]) -> None:
    for start in range(0, len(records), UPSERT_BATCH):
        batch = records[start:start + UPSERT_BATCH]
        index.upsert_records(namespace=namespace, records=batch)
        print(f"Upserted {min(start + len(batch), len(records))}/{len(records)}")


def main() -> None:
    load_dotenv()
    api_key = os.getenv("PINECONE_API_KEY", "").strip()
    index_name = os.getenv("PINECONE_INDEX_NAME", "").strip()
    if not api_key or not index_name:
        raise SystemExit("Set PINECONE_API_KEY and PINECONE_INDEX_NAME in backend/.env first.")

    namespace = os.getenv("PINECONE_NAMESPACE", "finora").strip() or "finora"
    text_field = os.getenv("PINECONE_TEXT_FIELD", "text").strip() or "text"
    PDF_DIR.mkdir(exist_ok=True)

    from pinecone import Pinecone

    pc = Pinecone(api_key=api_key)
    described = pc.describe_index(index_name)
    print(
        f"Index '{index_name}' namespace '{namespace}' "
        f"dimension {getattr(described, 'dimension', None)} "
        f"embed {getattr(described, 'embed', None)}"
    )
    index = pc.index(index_name)

    records = bundled_records(text_field)
    pdf_paths = sorted(PDF_DIR.glob("*.pdf"))
    if not records and not pdf_paths:
        raise SystemExit("No knowledge_base.json passages or PDFs in knowledge_pdfs/.")

    print(f"Bundled passages: {len(records)}")
    for path in pdf_paths:
        pdf_chunks = pdf_records(path, text_field)
        print(f"{path.name}: {len(pdf_chunks)} chunks")
        records.extend(pdf_chunks)

    upsert_batches(index, namespace, records)
    print(f"Submitted {len(records)} records to index '{index_name}' in namespace '{namespace}'.")
    print("Existing ids were updated in place. Pinecone may take a short time before new records are searchable.")


if __name__ == "__main__":
    main()
