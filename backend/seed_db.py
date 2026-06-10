import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGODB_DATABASE", "proposaldb")


def seed_database():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db["projects"]

    collection.delete_many({})

    sample_projects = [
        {
            "name": "RouteOpt Logistics",
            "industry": "Logistics",
            "description": (
                "Automated route planning and dispatch software scaling to support "
                "120+ active delivery drivers in real-time."
            ),
            "outcome": (
                "40% average route-time savings and 18% reduction in fuel consumption"
            ),
            "budget_range": "$80k-$100k",
        },
        {
            "name": "RetailSync POS",
            "industry": "Retail",
            "description": (
                "Unified cloud-native POS and omni-channel inventory management "
                "system running across 45 physical locations."
            ),
            "outcome": (
                "25% year-over-year revenue increase and near-instant stock synchronization"
            ),
            "budget_range": "$50k-$75k",
        },
        {
            "name": "FinGuard Compliance",
            "industry": "Financial Services",
            "description": (
                "Automated AI-driven compliance reporting platform designed for "
                "strict SOC2 and SEC auditing trails."
            ),
            "outcome": "60% faster manual audit preparation cycles and zero missed deadlines",
            "budget_range": "$120k-$150k",
        },
    ]

    result = collection.insert_many(sample_projects)
    print(
        f"Successfully seeded database! Inserted {len(result.inserted_ids)} project references."
    )
    client.close()


if __name__ == "__main__":
    seed_database()
