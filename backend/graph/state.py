from typing import TypedDict

class ProposalState(TypedDict):
    transcript: str

    requirements: dict

    similar_projects: list

    proposal: str