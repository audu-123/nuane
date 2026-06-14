import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { InterviewQueue } from './components/InterviewQueue';
import { ScoringBoard } from './components/ScoringBoard';
import { CandidateView } from './components/CandidateView';
import { InterviewArchive } from './components/InterviewArchive';
import { mockCandidates, learningResources as initialResources, mockArchiveRecords } from './data/mockData';
import { fetchCandidatesFromFeishu } from './services/feishu';
import { Bell } from 'lucide-react';
import type { Candidate, Page, LearningResource, InterviewRecord } from './types';

export interface SentEmailData {
  candidateName: string;
  result: 'pass' | 'fail';
  content: string;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('queue');
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [resources, setResources] = useState<LearningResource[]>(initialResources);
  const [archiveRecords, setArchiveRecords] = useState<InterviewRecord[]>(mockArchiveRecords);

  useEffect(() => {
    const loadFeishuData = async () => {
      const data = await fetchCandidatesFromFeishu();
      if (data && data.length > 0) {
        setCandidates(data);
      }
    };
    loadFeishuData();
  }, []);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<SentEmailData | null>(null);

  const handleEmailSent = (emailData: SentEmailData) => {
    setSentEmail(emailData);
    setToastMessage(`为了演示方便，系统将在 6 秒后自动跳转至候选人视角...`);
    
    setTimeout(() => {
      setCurrentPage('candidate');
      setSelectedCandidate(null);
      setToastMessage(null);
    }, 6000);
  };

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

  const handleEndInterview = (record: InterviewRecord) => {
    setArchiveRecords(prev => [record, ...prev]);
    setCandidates(prev => prev.filter(c => c.id !== record.candidateId));
    setCurrentPage('archive');
    setSelectedCandidate(null);
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
            <ScoringBoard candidate={fallback} onBack={handleBackFromScoring} resources={resources} setResources={setResources} onEndInterview={handleEndInterview} onEmailSent={handleEmailSent} />
          );
        }
        return (
          <ScoringBoard candidate={selectedCandidate} onBack={handleBackFromScoring} resources={resources} setResources={setResources} onEndInterview={handleEndInterview} onEmailSent={handleEmailSent} />
        );
      case 'candidate':
        return <CandidateView resources={resources} emailData={sentEmail} />;
      case 'archive':
        return <InterviewArchive records={archiveRecords} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F7FA] overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
            <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-[#0052D9]/20 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EEF3FF] flex items-center justify-center">
                <Bell size={16} className="text-[#0052D9]" />
              </div>
              <span className="text-sm font-medium text-gray-800">{toastMessage}</span>
              <button 
                onClick={() => handleNavigate('candidate')}
                className="text-xs px-2 py-1 bg-[#0052D9] text-white rounded hover:bg-[#003BA5] ml-2"
              >
                去查看
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
