'use client';

import { useState, useEffect } from 'react';
import { TestSuite } from '@/components/test/TestSuite';
import { PasswordProtection } from '@/components/test/PasswordProtection';

const TEST_PAGE_PASSWORD = process.env.NEXT_PUBLIC_TEST_PAGE_PASSWORD || 'test123';

export default function TestPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const authStatus = sessionStorage.getItem('test_page_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === TEST_PAGE_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('test_page_authenticated', 'true');
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Test Suite Access
          </h1>
          <p className="text-gray-300 text-center mb-6">
            Enter password to access comprehensive test suite
          </p>
          <PasswordProtection
            password={password}
            setPassword={setPassword}
            onSubmit={handlePasswordSubmit}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Comprehensive Test Suite
              </h1>
              <p className="text-gray-300">
                Testing all frontend and backend integration scenarios
              </p>
            </div>
            <button
              onClick={() => {
                sessionStorage.removeItem('test_page_authenticated');
                setIsAuthenticated(false);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Lock Page
            </button>
          </div>
        </div>
        <TestSuite />
      </div>
    </div>
  );
}

