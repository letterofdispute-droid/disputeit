export interface GscRow {
  query: string;
  page: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  fetched_at: string;
}

export interface Recommendation {
  uncoveredQueries?: Array<{
    query: string; impressions: number; clicks: number; position: number;
    suggestedVertical: string; suggestedArticleType: string; suggestedTitle: string; rationale: string;
  }>;
  quickWins?: Array<{
    query: string; page: string; impressions: number; clicks: number; ctr: number; position: number;
    suggestedMetaTitle: string; suggestedMetaDescription: string; rationale: string;
  }>;
  positionOpportunities?: Array<{
    query: string; page: string; position: number; impressions: number; action: string; rationale: string;
  }>;
  cannibalization?: Array<{
    query: string; pages: string[]; action: string; rationale: string;
  }>;
}
