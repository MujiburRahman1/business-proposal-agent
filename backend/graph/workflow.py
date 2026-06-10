from langgraph.graph import StateGraph

from graph.state import ProposalState

from agents.analyzer import analyze_transcript
from agents.researcher import search_knowledge
from agents.proposal import generate_proposal

builder = StateGraph(
    ProposalState
)

builder.add_node(
    "analyze",
    analyze_transcript
)

builder.add_node(
    "research",
    search_knowledge
)

builder.add_node(
    "proposal",
    generate_proposal
)

builder.add_edge(
    "analyze",
    "research"
)

builder.add_edge(
    "research",
    "proposal"
)

builder.set_entry_point(
    "analyze"
)

builder.set_finish_point(
    "proposal"
)

graph = builder.compile()