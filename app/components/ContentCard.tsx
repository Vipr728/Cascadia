interface ContentCardProps {
  type: 'youtube' | 'article' | 'podcast' | 'book';
  topic: string;
  title: string;
  description: string;
  author: string;
  duration: string;
}

export default function ContentCard({ type, topic, title, description, author, duration }: ContentCardProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'youtube':
        return {
          color: '#ff0000',
          label: 'YouTube',
          icon: '▶️',
          textColor: 'text-white'
        };
      case 'article':
        return {
          color: '#00b8a3',
          label: 'Article',
          icon: '📰',
          textColor: 'text-black'
        };
      case 'podcast':
        return {
          color: '#1db954',
          label: 'Podcast',
          icon: '🎧',
          textColor: 'text-white'
        };
      case 'book':
        return {
          color: '#8b4513',
          label: 'Book',
          icon: '📚',
          textColor: 'text-white'
        };
      default:
        return {
          color: '#333333',
          label: 'Content',
          icon: '📄',
          textColor: 'text-white'
        };
    }
  };

  const config = getTypeConfig(type);

  return (
    <div className="bg-[#262626] border border-[#404040] rounded-lg overflow-hidden hover:bg-[#333333] transition-colors cursor-pointer">
      <div 
        className="h-32 flex items-center justify-center"
        style={{ backgroundColor: config.color }}
      >
        <span className={`${config.textColor} text-2xl`}>{config.icon}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ 
              backgroundColor: config.color,
              color: config.textColor === 'text-white' ? 'white' : 'black'
            }}
          >
            {config.label}
          </span>
          <span className="bg-[#ffa116] text-black px-2 py-1 rounded text-xs font-medium">
            {topic}
          </span>
        </div>
        <h3 className="text-white font-medium mb-2">{title}</h3>
        <p className="text-[#b3b3b3] text-sm mb-3">{description}</p>
        <div className="flex items-center justify-between text-xs text-[#808080]">
          <span>{author}</span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
}
