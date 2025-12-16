import ApiKeySettings from '../../Components/ApiKeySettings/ApiKeySettings';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Settings</h1>
        <ApiKeySettings />
      </div>
    </div>
  );
}
