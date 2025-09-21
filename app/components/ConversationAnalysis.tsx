interface ConversationAnalysisProps {
  partnerName: string;
  conversationTopic: string;
  duration: string;
  timeAgo: string;
  fluencyScore: number;
  vocabularyScore: number;
  grammarScore: number;
  keyTopics: string;
  fluencyFeedback: string;
  vocabularyFeedback: string;
  grammarFeedback: string;
}

export default function ConversationAnalysis({
  partnerName,
  conversationTopic,
  duration,
  timeAgo,
  fluencyScore,
  vocabularyScore,
  grammarScore,
  keyTopics,
  fluencyFeedback,
  vocabularyFeedback,
  grammarFeedback
}: ConversationAnalysisProps) {
  return (
    <div className="bg-[#333333] border border-[#404040] rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#404040] transition-colors">
        <div className="flex items-center">
          <div>
            <div className="text-white font-medium">{partnerName}</div>
            <div className="text-[#b3b3b3] text-sm">{conversationTopic}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[#00b8a3] text-sm font-medium">{duration}</div>
            <div className="text-[#808080] text-xs">{timeAgo}</div>
          </div>
          <div className="text-[#808080] text-sm">▼</div>
        </div>
      </div>
      
      {/* AI Insights Dropdown */}
      <div className="border-t border-[#404040] p-4 bg-[#2a2a2a]">
        <h4 className="text-white font-medium mb-3 flex items-center">
          Convo Insights
        </h4>
        <div className="space-y-3">
          <div className="bg-[#333333] border border-[#404040] p-3 rounded">
            <div className="text-[#00b8a3] font-medium text-sm mb-1">Fluency Score: {fluencyScore}/10</div>
            <div className="text-[#b3b3b3] text-xs">{fluencyFeedback}</div>
          </div>
          <div className="bg-[#333333] border border-[#404040] p-3 rounded">
            <div className="text-[#ffa116] font-medium text-sm mb-1">Vocabulary Usage: {vocabularyScore}/10</div>
            <div className="text-[#b3b3b3] text-xs">{vocabularyFeedback}</div>
          </div>
          <div className="bg-[#333333] border border-[#404040] p-3 rounded">
            <div className="text-[#00b8a3] font-medium text-sm mb-1">Grammar Accuracy: {grammarScore}/10</div>
            <div className="text-[#b3b3b3] text-xs">{grammarFeedback}</div>
          </div>
          <div className="bg-[#333333] border border-[#404040] p-3 rounded">
            <div className="text-[#ffa116] font-medium text-sm mb-1">Key Topics Discussed</div>
            <div className="text-[#b3b3b3] text-xs">{keyTopics}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
