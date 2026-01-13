'use client';

import { TestResult } from './types';

interface TestCategoryProps {
  name: string;
  description: string;
  results: TestResult[];
  isRunning: boolean;
}

export function TestCategory({ name, description, results, isRunning }: TestCategoryProps) {
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;
  const totalCount = results.length;

  const getStatusColor = () => {
    if (totalCount === 0) return 'text-gray-400';
    if (failedCount > 0) return 'text-red-400';
    if (passedCount === totalCount) return 'text-green-400';
    return 'text-yellow-400';
  };

  const getStatusIcon = () => {
    if (totalCount === 0) return '⏳';
    if (failedCount > 0) return '❌';
    if (passedCount === totalCount) return '✅';
    return '⚠️';
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
            <span>{getStatusIcon()}</span>
            {name}
          </h3>
          <p className="text-gray-400 text-sm">{description}</p>
        </div>
        {totalCount > 0 && (
          <div className={`text-right ${getStatusColor()}`}>
            <div className="text-2xl font-bold">
              {passedCount}/{totalCount}
            </div>
            <div className="text-xs">
              {failedCount > 0 && <span className="text-red-400">{failedCount} failed</span>}
              {skippedCount > 0 && <span className="text-yellow-400 ml-2">{skippedCount} skipped</span>}
            </div>
          </div>
        )}
      </div>

      {totalCount === 0 && !isRunning && (
        <div className="text-gray-400 text-sm italic">No tests run yet</div>
      )}

      {isRunning && totalCount === 0 && (
        <div className="text-blue-400 text-sm">Running tests...</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 mt-4">
          {results.map((result, index) => (
            <TestResultItem key={index} result={result} />
          ))}
        </div>
      )}
    </div>
  );
}

function TestResultItem({ result }: { result: TestResult }) {
  const getStatusColor = () => {
    switch (result.status) {
      case 'passed':
        return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'skipped':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (result.status) {
      case 'passed':
        return '✅';
      case 'failed':
        return '❌';
      case 'skipped':
        return '⏭️';
      default:
        return '⏳';
    }
  };

  return (
    <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div className="flex-1">
          <div className="font-semibold">{result.name}</div>
          <div className="text-sm mt-1 opacity-90">{result.message}</div>
          {result.details && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                View Details
              </summary>
              <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

