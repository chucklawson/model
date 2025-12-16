import { useState, useEffect } from 'react';
import { Key, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { getUserFmpApiKey, setUserFmpApiKey, deleteUserFmpApiKey } from '../../utils/fmpApiClient';

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [actualApiKey, setActualApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadExistingKey();
  }, []);

  const loadExistingKey = async () => {
    try {
      const existing = await getUserFmpApiKey();
      if (existing) {
        setHasExistingKey(true);
        setActualApiKey(existing.apiKey);
        setApiKey('••••••••••••••••••••');
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey || apiKey.includes('•')) {
      setMessage({ type: 'error', text: 'Please enter a valid API key' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await setUserFmpApiKey(apiKey);
      setMessage({ type: 'success', text: 'API key saved successfully!' });
      setHasExistingKey(true);
      setActualApiKey(apiKey);
      setApiKey('••••••••••••••••••••');
      setShowKey(false);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure? You will fall back to the shared key.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await deleteUserFmpApiKey();
      setApiKey('');
      setActualApiKey('');
      setHasExistingKey(false);
      setShowKey(false);
      setMessage({ type: 'success', text: 'API key removed. Using fallback key.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to remove API key'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Key className="text-purple-600" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">FMP API Key</h2>
          <p className="text-sm text-slate-600">
            Manage your Financial Modeling Prep API key
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Your API Key
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={showKey && actualApiKey ? actualApiKey : apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setActualApiKey('');
                }}
                onFocus={() => {
                  if (apiKey.includes('•')) {
                    setApiKey('');
                    setShowKey(false);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg
                          focus:border-purple-500 focus:outline-none font-mono text-sm"
                placeholder="Enter your FMP API key"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                          hover:text-slate-600"
                type="button"
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Get your free API key from{' '}
            <a
              href="https://financialmodelingprep.com/developer/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              financialmodelingprep.com
            </a>
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-300'
              : 'bg-red-50 text-red-700 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold
                      hover:bg-purple-700 transition-colors flex items-center justify-center gap-2
                      disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {hasExistingKey ? 'Update Key' : 'Save Key'}
          </button>

          {hasExistingKey && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold
                        hover:bg-red-700 transition-colors flex items-center justify-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              Remove
            </button>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
          <strong>Note:</strong> Your API key is stored securely server-side. Without your own key,
          the app uses a shared fallback key.
        </div>
      </div>
    </div>
  );
}
