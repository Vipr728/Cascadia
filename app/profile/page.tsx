"use client";

import WeaknessCard from '../components/WeaknessCard';
import PlaceCall from '../components/PlaceCall';
import { useEffect, useState } from 'react';

export default function Profile() {
  const [fetched, setFetched] = useState<any | null>(null);
  // Simulate app age of 2 days (typed as number to avoid literal narrowing)
  const appAgeDays = 2 as number;
  const streakDays = appAgeDays as number;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analysis');
        const data = await res.json();
        setFetched(data?.record?.analysis || null);
      } catch {}
    }
    load();
  }, []);

  const weaknesses = fetched?.weaknesses ? {
    critical: (fetched.weaknesses as any[]).filter(w => w.severity === 'critical').map(w => ({
      title: w.title,
      description: w.description,
      focus: w.focus,
      score: 0,
    })),
    moderate: (fetched.weaknesses as any[]).filter(w => w.severity === 'moderate').map(w => ({
      title: w.title,
      description: w.description,
      focus: w.focus,
      score: 0,
    })),
    minor: (fetched.weaknesses as any[]).filter(w => w.severity === 'minor').map(w => ({
      title: w.title,
      description: w.description,
      focus: w.focus,
      score: 0,
    })),
  } : {
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
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header with Workflow Steps */}
      <div className="bg-[#1e1e1e] border-b border-[#404040] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Chatty</h1>
          {/* Heatmap - Left aligned, centered horizontally */}
          <div className="flex justify-center">
            <div className="max-w-7xl w-full px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 26 }, (_, week) => (
                    <div key={week} className="flex flex-col gap-0.5">
                      {Array.from({ length: 7 }, (_, day) => {
                        // Compute from the start of the grid (top-left)
                        const cellsFromStart = week * 7 + day;
                        const active = cellsFromStart < appAgeDays;
                        const intensity = active ? 0.9 - (cellsFromStart * 0.2) : 0;
                        const getColor = (n: number) => {
                          if (n <= 0) return 'bg-[#161b22]';
                          if (n < 0.4) return 'bg-[#0e4429]';
                          if (n < 0.6) return 'bg-[#006d32]';
                          if (n < 0.8) return 'bg-[#26a641]';
                          return 'bg-[#39d353]';
                        };
                        return (
                          <div
                            key={day}
                            className={`w-2 h-2 rounded-sm ${getColor(intensity)}`}
                            title={`day ${cellsFromStart + 1}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
            <div className="flex items-center gap-4">
              <span className="text-[#00b8a3] text-sm">✓</span>
              <div className="text-right">
                <div className="text-[#00b8a3] text-sm font-medium">{streakDays} day{streakDays !== 1 ? 's' : ''} streak</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#00b8a3] rounded-full" title="Call with AI"></div>
                <div className="w-2 h-2 bg-[#00b8a3] rounded-full" title="Acknowledge Weaknesses"></div>
                <div className="w-2 h-2 bg-[#00b8a3] rounded-full" title="Talk to 5 People"></div>
                <div className="w-2 h-2 bg-[#00b8a3] rounded-full" title="Content Recommendations"></div>
              </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6">        
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
      <div className="max-w-7xl mx-auto p-6 center-content"><PlaceCall /></div>
    </div>
  );
}
