from pymongo import MongoClient
import os

client = MongoClient(
    os.getenv("MONGODB_URI")
)

db = client["proposaldb"]

def search_knowledge(state):

    projects = db.projects.find().limit(3)

    results = []

    for p in projects:
        results.append({
            "name": p["name"],
            "industry": p["industry"]
        })

    state["similar_projects"] = results

    return state