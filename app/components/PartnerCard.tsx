interface PartnerCardProps {
  name: string;
  country: string;
  language: string;
  level: string;
  interests: string[];
  avatar: string;
  online: boolean;
  rating: number;
  isTopCard?: boolean;
  isSecondCard?: boolean;
  isThirdCard?: boolean;
}

export default function PartnerCard({
  name,
  country,
  language,
  level,
  interests,
  avatar,
  online,
  rating,
  isTopCard = false,
  isSecondCard = false,
  isThirdCard = false
}: PartnerCardProps) {
  const getCardStyles = () => {
    if (isTopCard) {
      return 'z-30 scale-100 opacity-100';
    } else if (isSecondCard) {
      return 'z-20 scale-95 opacity-80 top-8';
    } else if (isThirdCard) {
      return 'z-10 scale-90 opacity-60 top-16';
    }
    return 'z-30 scale-100 opacity-100';
  };

  const getTransform = () => {
    if (isSecondCard) {
      return 'translateY(8px) scale(0.95)';
    } else if (isThirdCard) {
      return 'translateY(16px) scale(0.90)';
    }
    return 'translateY(0px) scale(1)';
  };

  return (
    <div
      className={`absolute inset-4 bg-[#333333] border border-[#404040] rounded-lg p-6 transition-all duration-300 ${getCardStyles()}`}
      style={{
        transform: getTransform(),
      }}
    >
      <div className="flex items-center mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-lg">{name}</h3>
            <div className={`w-3 h-3 rounded-full ${online ? 'bg-[#00b8a3]' : 'bg-[#808080]'}`}></div>
          </div>
          <p className="text-[#b3b3b3] text-sm">{country} • {language} {level}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <h4 className="text-white font-medium mb-2">Commonalities</h4>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest, i) => (
            <span key={i} className="bg-[#404040] text-[#b3b3b3] px-2 py-1 rounded text-xs">
              {interest}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button className="flex-1 bg-[#00b8a3] hover:bg-[#00a693] text-white py-2 px-4 rounded-lg font-medium transition-colors">
          Start Convo
        </button>
      </div>
    </div>
  );
}
