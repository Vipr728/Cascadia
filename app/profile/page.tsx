import WeaknessCard from '../components/WeaknessCard';

export default function Profile() {
  const weaknesses = {
    critical: [
      {
        title: "Grammar Patterns",
        description: "Struggling with complex sentence structures and conditional tenses",
        focus: "Subjunctive mood, passive voice",
        score: 3.2
      },
      {
        title: "Verb Conjugations",
        description: "Inconsistent with irregular verb forms and tense usage",
        focus: "Past perfect, future subjunctive",
        score: 2.8
      }
    ],
    moderate: [
      {
        title: "Vocabulary Retention",
        description: "Difficulty remembering advanced vocabulary in context",
        focus: "Spaced repetition, contextual learning",
        score: 5.4
      },
      {
        title: "Speaking Fluency",
        description: "Pauses and hesitation during conversation practice",
        focus: "Shadowing exercises, conversation drills",
        score: 4.9
      },
      {
        title: "Pronunciation",
        description: "Some sounds and intonation patterns need improvement",
        focus: "Rolling R's, accent marks",
        score: 5.1
      }
    ],
    minor: [
      {
        title: "Listening Comprehension",
        description: "Good progress with native speaker conversations",
        focus: "Keep practicing: Podcasts, movies, news",
        score: 7.8
      },
      {
        title: "Reading Speed",
        description: "Can read but sometimes needs to slow down for complex texts",
        focus: "Practice with news articles, literature",
        score: 6.9
      },
      {
        title: "Cultural Context",
        description: "Understanding idioms and cultural references",
        focus: "Watch Spanish shows, read local news",
        score: 6.2
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Learning Profile</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Weaknesses */}
          <div className="bg-[#262626] border border-[#ff6b6b] rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-4 h-4 bg-[#ff6b6b] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-white">Critical</h2>
            </div>
            <div className="space-y-4">
              {weaknesses.critical.map((weakness, index) => (
                <WeaknessCard
                  key={index}
                  title={weakness.title}
                  description={weakness.description}
                  focus={weakness.focus}
                  score={weakness.score}
                  severity="critical"
                />
              ))}
            </div>
          </div>

          {/* Moderate Weaknesses */}
          <div className="bg-[#262626] border border-[#ffa116] rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-4 h-4 bg-[#ffa116] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-white">Moderate</h2>
            </div>
            <div className="space-y-4">
              {weaknesses.moderate.map((weakness, index) => (
                <WeaknessCard
                  key={index}
                  title={weakness.title}
                  description={weakness.description}
                  focus={weakness.focus}
                  score={weakness.score}
                  severity="moderate"
                />
              ))}
            </div>
          </div>

          {/* Minor Weaknesses */}
          <div className="bg-[#262626] border border-[#00b8a3] rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-4 h-4 bg-[#00b8a3] rounded-full mr-3"></div>
              <h2 className="text-xl font-bold text-white">Minor</h2>
            </div>
            <div className="space-y-4">
              {weaknesses.minor.map((weakness, index) => (
                <WeaknessCard
                  key={index}
                  title={weakness.title}
                  description={weakness.description}
                  focus={weakness.focus}
                  score={weakness.score}
                  severity="minor"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
