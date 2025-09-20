interface WeaknessCardProps {
  title: string;
  description: string;
  focus: string;
  score: number;
  severity: 'critical' | 'moderate' | 'minor';
}

export default function WeaknessCard({
  title,
  description,
  focus,
  score,
  severity
}: WeaknessCardProps) {
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          color: '#ff6b6b',
          borderColor: 'border-[#ff6b6b]'
        };
      case 'moderate':
        return {
          color: '#ffa116',
          borderColor: 'border-[#ffa116]'
        };
      case 'minor':
        return {
          color: '#00b8a3',
          borderColor: 'border-[#00b8a3]'
        };
      default:
        return {
          color: '#808080',
          borderColor: 'border-[#404040]'
        };
    }
  };

  const config = getSeverityConfig(severity);

  return (
    <div className="bg-[#333333] border border-[#404040] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-medium">{title}</h3>
        <span 
          className="text-sm font-bold"
          style={{ color: config.color }}
        >
          {score}/10
        </span>
      </div>
      <p className="text-[#b3b3b3] text-sm mb-3">{description}</p>
      <div className="bg-[#404040] text-[#808080] text-xs px-2 py-1 rounded">
        Focus: {focus}
      </div>
    </div>
  );
}
