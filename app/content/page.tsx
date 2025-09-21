import ContentCard from '../components/ContentCard';

export default function Content() {
  const recommendations = [
    {
      type: 'youtube' as const,
      topic: 'Grammar',
      title: 'Master Spanish Subjunctive Mood',
      description: 'Learn when and how to use the subjunctive mood in Spanish with practical examples and exercises.',
      author: 'Spanish with Maria',
      duration: '15 min'
    },
    {
      type: 'article' as const,
      topic: 'Vocabulary',
      title: '50 Essential Business Spanish Phrases',
      description: 'Essential vocabulary and phrases for professional Spanish communication in business settings.',
      author: 'Spanish Business Today',
      duration: '8 min read'
    },
    {
      type: 'podcast' as const,
      topic: 'Listening',
      title: 'Spanish Stories for Beginners',
      description: 'Engaging short stories in Spanish with slow narration and English explanations.',
      author: 'Learn Spanish Daily',
      duration: '25 min'
    },
    {
      type: 'book' as const,
      topic: 'Speaking',
      title: 'Conversational Spanish Mastery',
      description: 'A comprehensive guide to improving your Spanish conversation skills with practical dialogues.',
      author: 'Linguistic Press',
      duration: '320 pages'
    },
    {
      type: 'youtube' as const,
      topic: 'Speaking',
      title: 'Spanish Pronunciation Guide',
      description: 'Master Spanish pronunciation with tongue twisters and pronunciation exercises.',
      author: 'Spanish Academy',
      duration: '12 min'
    },
    {
      type: 'article' as const,
      topic: 'Grammar',
      title: 'Understanding Spanish Verb Tenses',
      description: 'A complete breakdown of Spanish verb tenses with examples and usage patterns.',
      author: 'Spanish Grammar Hub',
      duration: '12 min read'
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Today's Picks</h1>
        
        {/* Content Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec, index) => (
            <ContentCard
              key={index}
              type={rec.type}
              topic={rec.topic}
              title={rec.title}
              description={rec.description}
              author={rec.author}
              duration={rec.duration}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
