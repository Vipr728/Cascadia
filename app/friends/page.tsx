import ConversationAnalysis from '../components/ConversationAnalysis';
import PartnerCard from '../components/PartnerCard';

export default function Friends() {
  const languagePartners = [
    {
      id: 1,
      name: "María González",
      country: "Spain",
      language: "Spanish",
      level: "Native",
      interests: ["Travel", "Cooking", "Music"],
      avatar: "👩‍💼",
      online: true,
      rating: 4.9
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      country: "Mexico",
      language: "Spanish",
      level: "Native",
      interests: ["Sports", "Technology", "Movies"],
      avatar: "👨‍💻",
      online: true,
      rating: 4.8
    },
    {
      id: 3,
      name: "Ana Rodríguez",
      country: "Argentina",
      language: "Spanish",
      level: "Native",
      interests: ["Art", "Literature", "Photography"],
      avatar: "👩‍🎨",
      online: false,
      rating: 4.9
    },
    {
      id: 4,
      name: "Diego Silva",
      country: "Colombia",
      language: "Spanish",
      level: "Native",
      interests: ["Business", "Fitness", "Gaming"],
      avatar: "👨‍💼",
      online: true,
      rating: 4.7
    },
    {
      id: 5,
      name: "Isabella Cruz",
      country: "Peru",
      language: "Spanish",
      level: "Native",
      interests: ["Culture", "History", "Dancing"],
      avatar: "👩‍🎭",
      online: true,
      rating: 4.8
    },
    {
      id: 6,
      name: "Fernando López",
      country: "Chile",
      language: "Spanish",
      level: "Native",
      interests: ["Nature", "Hiking", "Photography"],
      avatar: "👨‍🌾",
      online: false,
      rating: 4.6
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Speed Talks</h1>

        {/* Speed Talk Roulette */}
        <div className="bg-[#262626] rounded-lg border border-[#404040] p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Next Partner</h2>
          </div>

          {/* Roulette Container */}
          <div className="relative h-76 overflow-hidden rounded-lg mb-6">            
            {/* Partner Cards Stack */}
            <div className="relative h-full">
              {languagePartners.slice(0, 3).map((partner, index) => (
                <PartnerCard
                  key={partner.id}
                  name={partner.name}
                  country={partner.country}
                  language={partner.language}
                  level={partner.level}
                  interests={partner.interests}
                  avatar={partner.avatar}
                  online={partner.online}
                  rating={partner.rating}
                  isTopCard={index === 0}
                  isSecondCard={index === 1}
                  isThirdCard={index === 2}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="mt-6 bg-[#262626] rounded-lg border border-[#404040] p-6">
          <h3 className="text-white font-semibold mb-4">Recent Convos</h3>
          <div className="space-y-3">
            <ConversationAnalysis
              partnerName="María González"
              conversationTopic="Travel & Culture Discussion"
              duration="5:00"
              timeAgo="2 hours ago"
              fluencyScore={7.2}
              vocabularyScore={6.8}
              grammarScore={8.1}
              keyTopics="Travel experiences, Spanish culture, food preferences, future travel plans"
              fluencyFeedback="Good pace with occasional pauses. Practice more complex sentence structures."
              vocabularyFeedback="Used basic travel vocabulary well. Try incorporating more advanced descriptive words."
              grammarFeedback="Excellent use of past tense. Minor errors with subjunctive mood."
            />
            
            <ConversationAnalysis
              partnerName="Carlos Mendoza"
              conversationTopic="Technology & Innovation"
              duration="4:32"
              timeAgo="1 day ago"
              fluencyScore={6.5}
              vocabularyScore={7.4}
              grammarScore={7.8}
              keyTopics="AI development, programming languages, startup culture, remote work"
              fluencyFeedback="Some hesitation with technical terms. Practice technology vocabulary more."
              vocabularyFeedback="Good use of business Spanish. Could expand technical terminology."
              grammarFeedback="Solid grammar foundation. Work on conditional tenses for future scenarios."
            />
          </div>
        </div>
      </div>
    </div>
  );
}