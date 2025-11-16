
import * as React from 'react';
import { ThoughtStep } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';

// --- INLINE SVG ICONS ---

const AIIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13.5l.648 1.938a3.375 3.375 0 002.456 2.456L21 18l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

const RoadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);
const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const TrafficIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 006-6c0-4-6-12-6-12S6 8 6 12a6 6 0 006 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
);

// --- HELPER COMPONENTS ---

const getStatusIcon = (step: ThoughtStep) => {
  if (step.id === 'recommendation' || step.id === 'final_answer') {
      return <AIIcon />;
  }
  if (step.id === 'data_source') {
      return <LinkIcon />;
  }
  switch (step.status) {
    case 'running':
      return <SpinnerIcon className="animate-spin h-5 w-5 text-blue-400" />;
    case 'success':
      return <CheckIcon className="h-5 w-5 text-green-400" />;
    case 'error':
      return <XIcon className="h-5 w-5 text-red-400" />;
    case 'pending':
    default:
      return <div className="h-3 w-3 rounded-full bg-gray-600" />;
  }
};

const DetailParser: React.FC<{ text: string; stepId: string }> = ({ text, stepId }) => {
    if (stepId === 'final_answer') {
        return (
            <p className="text-sm mt-1 text-gray-200 break-words">
                {text}
            </p>
        );
    }

    if (stepId === 'data_source') {
        const isUrl = text.startsWith('http://') || text.startsWith('https://');
        if (isUrl) {
            return (
                <a href={text} target="_blank" rel="noopener noreferrer" className="text-xs mt-1 text-cyan-400 font-mono italic hover:underline break-all">
                    {text}
                </a>
            );
        }
        return (
             <p className="text-xs mt-1 text-gray-400 font-mono italic">
                {text}
            </p>
        );
    }
    
    if (text.includes('|')) {
        const parts = text.split('|').map(part => part.trim());
        const details = { distance: '', time: '', traffic: '' };
        parts.forEach(part => {
            if (part.startsWith('Distance:')) details.distance = part.replace('Distance: ', '');
            if (part.startsWith('Time:')) details.time = part.replace('Time: ', '');
            if (part.startsWith('Traffic:')) details.traffic = part.replace('Traffic: ', '');
        });

        return (
            <div className="grid grid-cols-3 gap-2 mt-2 text-center font-mono text-xs">
                <div className="bg-black/20 p-1.5 rounded-md flex flex-col items-center justify-center">
                    <RoadIcon />
                    <span className="mt-1">{details.distance}</span>
                </div>
                <div className="bg-black/20 p-1.5 rounded-md flex flex-col items-center justify-center">
                    <ClockIcon />
                    <span className="mt-1">{details.time}</span>
                </div>
                <div className="bg-black/20 p-1.5 rounded-md flex flex-col items-center justify-center">
                    <TrafficIcon />
                    <span className="mt-1">{details.traffic}</span>
                </div>
            </div>
        )
    }
    return (
        <p className="text-xs mt-1 text-gray-400 font-mono italic">
            {text}
        </p>
    );
};


// --- MAIN COMPONENT ---

interface ChainOfThoughtProps {
    steps: ThoughtStep[];
}

const ChainOfThought: React.FC<ChainOfThoughtProps> = ({ steps }) => {
    if (steps.length === 0) return null;

    return (
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 w-72 md:w-80 flex flex-col pointer-events-auto max-h-[80vh]">
            <header className="px-4 py-2">
                 <h3 className="text-lg font-semibold text-gray-200 text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                    Live Analysis
                </h3>
            </header>
            <div className="relative overflow-y-auto pr-4 pl-2 py-2 thin-scrollbar">
                {steps.map((step, index) => {
                    const isRecommendation = step.id === 'recommendation';
                    const isDataSource = step.id === 'data_source';
                    const isFinalAnswer = step.id === 'final_answer';
                    const statusClass = `status-${step.status}`;
                    const cardClasses = [
                        'analysis-card',
                        'relative',
                        'ml-8',
                        'p-3',
                        'rounded-lg',
                        'transition-all duration-500',
                        'bg-gray-900/50',
                        'backdrop-blur-md',
                        statusClass,
                        (isRecommendation || isFinalAnswer) ? 'recommendation-card' : '',
                        isDataSource ? 'datasource-card' : ''
                    ].join(' ');
                    
                    return (
                        <div 
                            key={step.id} 
                            className="relative pl-4 pb-5 step-container"
                        >
                            {/* Central Timeline */}
                            <div className="absolute top-0 left-0 h-full w-0.5 bg-cyan-400/10" />

                            {/* Status Icon Node */}
                            <div className="absolute top-2 left-[-6px] h-5 w-5 flex items-center justify-center bg-gray-900 rounded-full z-10">
                               {getStatusIcon(step)}
                            </div>
                            
                            <div className={cardClasses} style={{ animationDelay: `${index * 100}ms` }}>
                                {step.status === 'running' && <div className="scanner-line" />}
                                <p className="text-sm font-medium text-white pr-2">{step.title}</p>
                                {step.details && (
                                    <div className={`mt-1 text-gray-300 ${step.status === 'error' ? 'text-red-400' : ''}`}>
                                        <DetailParser text={step.details} stepId={step.id} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`
                .step-container {
                    animation: slide-in 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
                    opacity: 0;
                    animation-delay: calc(var(--i, 0) * 100ms);
                }
                @keyframes slide-in {
                  0% {
                    transform: translateX(50px);
                    opacity: 0;
                  }
                  100% {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }

                .analysis-card {
                    border: 1px solid;
                    border-color: transparent;
                    background-image: 
                        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
                        radial-gradient(circle at top left, rgba(0, 255, 255, 0.08), transparent 30%);
                }

                .analysis-card.status-pending { border-color: rgba(107, 114, 128, 0.2); }
                .analysis-card.status-running { 
                    border-color: rgba(96, 165, 250, 0.5); 
                    box-shadow: 0 0 15px rgba(96, 165, 250, 0.2);
                    animation: pulse-border 2s infinite;
                }
                .analysis-card.status-success { border-color: rgba(74, 222, 128, 0.3); }
                .analysis-card.status-error { border-color: rgba(248, 113, 113, 0.4); }

                .recommendation-card {
                    border-color: rgba(192, 132, 252, 0.5);
                    background-image: 
                        linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
                        radial-gradient(circle at top left, rgba(192, 132, 252, 0.15), transparent 40%);
                }

                .datasource-card {
                    border-color: rgba(34, 211, 238, 0.4);
                }
                
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.2); }
                    50% { box-shadow: 0 0 25px rgba(96, 165, 250, 0.4); }
                    100% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.2); }
                }

                .scanner-line {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.8), transparent);
                    animation: scan 2.5s infinite linear;
                    opacity: 0.7;
                }
                @keyframes scan {
                    from { top: 0; }
                    to { top: 100%; }
                }

                .thin-scrollbar::-webkit-scrollbar { width: 4px; }
                .thin-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .thin-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 255, 255, 0.3);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

export default ChainOfThought;