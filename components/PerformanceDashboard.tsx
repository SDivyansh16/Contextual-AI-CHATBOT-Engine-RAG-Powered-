/**
 * @file PerformanceDashboard.tsx
 * @description A component that displays illustrative performance metrics and success criteria for the RAG system.
 * NOTE: The data presented here is static and for demonstration purposes only.
 */
import React, { useState } from 'react';
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, RadioButtonIcon } from './Icons';

// --- SUB-COMPONENT: MetricCard ---

interface MetricCardProps {
    title: string;
    value: string;
    description: string;
    isPrimary?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, isPrimary = false }) => (
    <div className="bg-white/60 p-4 rounded-lg text-center">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`text-2xl font-bold my-1 ${isPrimary ? 'bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-green-500' : 'text-teal-600'}`}>
            {value}
        </p>
        <p className="text-xs text-slate-400">{description}</p>
    </div>
);

// --- STATIC DATA FOR DEMONSTRATION ---

const failedQueries = [
    { query: "What is the capital of Mars?", reason: "Information not in knowledge base. The query is outside the scope of the provided documents." },
    { query: "Tell me about the thing.", reason: "Ambiguous query. The term 'the thing' is too vague for effective semantic search." },
    { query: "синий", reason: "Language mismatch. Query is in a different language than the document corpus." },
    { query: "What was the conclusion?", reason: "Lacks context. The query is conversational and relies on previous turns not available in a stateless retrieval." },
    { query: "How is product X different from product Y?", reason: "Comparative query requires synthesis of information from multiple documents that may not be retrieved in the same context." },
];

const successCriteria = [
    { text: "60%+ accuracy on test set", completed: false },
    { text: "Performance report completed", completed: false },
    { text: "Improvements documented", completed: false },
];

// --- MAIN COMPONENT: PerformanceDashboard ---

export const PerformanceDashboard: React.FC = () => {
    // State to control the visibility of the collapsible dashboard content.
    const [isShowing, setIsShowing] = useState(false);

    return (
        <div className="w-full p-0.5 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg shadow-md">
            <div className="w-full bg-white/60 backdrop-blur-lg rounded-[7px] p-4">
                {/* Collapsible Header */}
                <button
                    onClick={() => setIsShowing(!isShowing)}
                    className="flex items-center justify-between w-full text-slate-800 hover:text-teal-600 focus:outline-none"
                >
                    <h3 className="text-lg font-semibold flex items-center">
                        <ChartBarIcon className="w-5 h-5 mr-2 text-teal-600" />
                        Performance Dashboard
                    </h3>
                    <svg className={`w-6 h-6 transition-transform duration-300 ${isShowing ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                <p className="text-xs text-slate-500 mt-1">
                    Evaluation metrics and success criteria for the RAG system.
                </p>

                {/* Collapsible Content */}
                {isShowing && (
                    <div className="mt-4 space-y-6">
                        {/* Section: Required Metrics */}
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 mb-3">Required Metrics</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <MetricCard title="Retrieval Accuracy" value="82%" description="Relevant chunks retrieved" isPrimary/>
                                <MetricCard title="Response Relevance" value="4.1/5" description="Human evaluation score" />
                                <MetricCard title="Avg. Response Time" value="2.1s" description="Query to full response" />
                            </div>
                        </div>

                        {/* Section: Failed Query Analysis */}
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 mb-3 flex items-center">
                                <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-500" />
                                Failed Query Analysis
                            </h4>
                            <div className="space-y-3 text-sm max-h-48 overflow-y-auto pr-2">
                                {failedQueries.map((item, index) => (
                                    <div key={index} className="bg-slate-100/80 p-3 rounded-lg">
                                        <p className="font-semibold text-slate-700 truncate">Query: "{item.query}"</p>
                                        <p className="text-xs text-slate-500 mt-1"><strong>Analysis:</strong> {item.reason}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section: Success Metrics */}
                        <div>
                            <h4 className="text-md font-semibold text-slate-700 mb-3">Success Metrics</h4>
                            <ul className="space-y-2 text-sm">
                                {successCriteria.map((item, index) => (
                                    <li key={index} className={`flex items-center ${item.completed ? 'text-green-600' : 'text-slate-500'}`}>
                                        {item.completed ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <RadioButtonIcon className="w-5 h-5 mr-2" />}
                                        <span>{item.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};