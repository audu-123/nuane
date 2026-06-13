import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { InterviewQueue } from './components/InterviewQueue';
import { ScoringBoard } from './components/ScoringBoard';
import { CandidateView } from './components/CandidateView';
import { InterviewArchive } from './components/InterviewArchive';
import { mockCandidates, learningResources as initialResources } from './data/mockData';
import type { Candidate, Page, LearningResource } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('queue');
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resources, setResources] = useState<LearningResource[]>(initialResources);

  const handleEnterScoring = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCurrentPage('scoring');
  };

  const handleBackFromScoring = () => {
    setCurrentPage('queue');
    setSelectedCandidate(null);
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'scoring') {
      setSelectedCandidate(null);
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'queue':
        return (
          <InterviewQueue
            candidates={candidates}
            onCandidatesChange={setCandidates}
            onEnterScoring={handleEnterScoring}
          />
        );
      case 'scoring':
        if (!selectedCandidate) {
          // If navigated directly without a candidate, show the first one
          const fallback = candidates[0];
          if (!fallback) {
            return (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                请先从「待面试列表」选择候选人
              </div>
            );
          }
          return (
            <ScoringBoard candidate={fallback} onBack={handleBackFromScoring} resources={resources} setResources={setResources} />
          );
        }
        return (
          <ScoringBoard candidate={selectedCandidate} onBack={handleBackFromScoring} resources={resources} setResources={setResources} />
        );
      case 'candidate':
        return <CandidateView resources={resources} />;
      case 'archive':
        return <InterviewArchive />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
