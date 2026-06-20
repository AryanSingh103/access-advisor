import logging
import os
import sys

import chromadb
from llama_index.core import SimpleDirectoryReader, StorageContext, VectorStoreIndex
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "wcag_docs"
CHROMA_PATH = "./chroma_db"
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data")


def load_documents():
    reader = SimpleDirectoryReader(
        input_files=[
            os.path.join(DATA_PATH, "wcag21.html"),
            os.path.join(DATA_PATH, "wcag21_quickref.html"),
        ]
    )
    return reader.load_data()


def chunk_documents(docs):
    splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)
    return splitter.get_nodes_from_documents(docs)


def _get_chroma_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client, client.get_or_create_collection(COLLECTION_NAME)


def build_vector_store() -> VectorStoreIndex:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

    docs = load_documents()
    nodes = chunk_documents(docs)
    logger.info("Chunked documents into %d nodes", len(nodes))

    chroma_client, collection = _get_chroma_collection()
    vector_store = ChromaVectorStore(chroma_collection=collection)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    embed_model = OpenAIEmbedding(model="text-embedding-3-small")
    index = VectorStoreIndex(nodes, storage_context=storage_context, embed_model=embed_model)
    logger.info("Stored %d chunks in ChromaDB collection '%s'", len(nodes), COLLECTION_NAME)
    return index


def get_or_create_index() -> VectorStoreIndex:
    os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY

    chroma_client, collection = _get_chroma_collection()
    count = collection.count()

    if count > 0:
        logger.info("ChromaDB collection '%s' already has %d chunks — loading existing index", COLLECTION_NAME, count)
        vector_store = ChromaVectorStore(chroma_collection=collection)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        embed_model = OpenAIEmbedding(model="text-embedding-3-small")
        return VectorStoreIndex.from_vector_store(vector_store, embed_model=embed_model)

    logger.info("ChromaDB collection '%s' is empty — running full ingest pipeline", COLLECTION_NAME)
    return build_vector_store()
