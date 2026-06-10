export type SimilarProject = {
  name: string;
  industry: string;
};

export type Requirements = {
  raw_analysis: string;
  industry?: string;
  company_size?: string;
  pain_points?: string[];
  timeline?: string;
  budget?: string;
};

export type ProposalResult = {
  transcript: string;
  requirements: Requirements;
  similar_projects: SimilarProject[];
  proposal: string;
  saved_to_mongodb?: boolean;
  mongodb_id?: string;
};

export type PipelineStep = {
  id: "analyze" | "research" | "proposal";
  label: string;
  description: string;
};

export type ApiError = {
  error: string;
};

export type ChatToolItem = {
  type: "tool";
  name: string;
  status: "running" | "complete";
};

export type ChatAssistantItem = {
  type: "assistant";
  text: string;
};

export type ChatUserItem = {
  type: "user";
  text: string;
};

export type ChatItem = ChatUserItem | ChatToolItem | ChatAssistantItem;

export type AgentChatResponse = {
  sessionId: string;
  items: ChatItem[];
  proposalResult?: ProposalResult;
  saved_to_mongodb?: boolean;
  mongodb_id?: string;
};
