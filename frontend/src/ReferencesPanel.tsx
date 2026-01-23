import React from 'react';
import { Reference } from './types';

interface ReferencesPanelProps {
  references: Reference[];
}

const ReferencesPanel: React.FC<ReferencesPanelProps> = ({ references }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-800">References</h3>
        <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
          {references.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {references.length === 0 ? (
          <div className="flex items-center justify-center h-full px-5 text-center text-gray-500 text-xs leading-relaxed">
            <p>No references yet. Start chatting to see references used in responses.</p>
          </div>
        ) : (
          references.map((reference) => (
            <div 
              key={reference.id} 
              className="p-4 mb-3 bg-gray-50 rounded-lg border-l-4 border-emerald-600 transition-all hover:-translate-y-0.5 hover:shadow-md animate-fadeIn"
            >
              <div className="text-sm font-semibold text-gray-800 mb-2">
                {reference.title}
              </div>
              <div className="text-xs text-gray-600 leading-relaxed mb-2">
                {reference.snippet}
              </div>
              <div className="text-xs text-emerald-600 font-mono">
                Source: {reference.source}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReferencesPanel;
