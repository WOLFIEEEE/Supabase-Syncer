'use client';

interface PasswordProtectionProps {
  password: string;
  setPassword: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PasswordProtection({
  password,
  setPassword,
  onSubmit,
}: PasswordProtectionProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter test page password"
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
      >
        Access Test Suite
      </button>
    </form>
  );
}

