"""Quick test script for MongoDB MCP tools against Atlas."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from mcp_server import (  # noqa: E402
    aggregate_documents,
    find_documents,
    list_recent_proposals,
    search_similar_projects,
)


def main():
    print("=== MongoDB MCP Connection Test ===\n")

    print("1. search_similar_projects('Logistics')")
    projects = search_similar_projects("Logistics")
    print(f"   Found {len(projects)} project(s)")
    for p in projects:
        print(f"   - {p.get('name')} ({p.get('industry')})")

    print("\n2. find_documents(filter={'industry': 'Logistics'})")
    docs = find_documents(filter={"industry": "Logistics"}, limit=3)
    print(f"   Found {len(docs)} document(s)")

    print("\n3. aggregate_documents(industry='Logistics')")
    stats = aggregate_documents(collection="projects", industry="Logistics")
    print(f"   Total projects: {stats.get('total')}")
    print(f"   Logistics matches: {stats.get('match_count')}")

    print("\n4. list_recent_proposals(limit=3)")
    recent = list_recent_proposals(limit=3)
    print(f"   Found {len(recent)} saved proposal(s)")

    print("\n=== All MCP tools responded successfully ===")


if __name__ == "__main__":
    main()
