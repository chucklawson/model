import { X, Building2, Globe, Users, MapPin, Phone } from 'lucide-react';

interface CompanyProfile {
  symbol: string;
  price: number;
  companyName: string;
  description: string;
  ceo: string;
  sector: string;
  industry: string;
  website: string;
  image: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  profile: CompanyProfile | null;
  loading: boolean;
  error: Error | null;
  onClose: () => void;
}

export default function CompanyInfoModal({ profile, loading, error, onClose }: Props) {
  if (!profile && !loading && !error) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 flex justify-between items-start">
          <div className="flex items-start gap-4">
            {profile?.image && (
              <img
                src={profile.image}
                alt={profile.companyName}
                className="w-16 h-16 rounded-lg bg-white p-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {loading ? 'Loading...' : profile?.companyName || 'Company Information'}
              </h2>
              {profile && (
                <div className="flex gap-4 text-sm text-blue-100">
                  <span className="font-semibold">{profile.symbol}</span>
                  <span>${profile.price?.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-12">
              <div className="text-lg text-slate-600">Loading company information...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-semibold">Error loading company information:</p>
              <p>{error.message}</p>
            </div>
          )}

          {profile && !loading && (
            <div className="space-y-6">
              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Building2 size={18} />
                    <span className="text-sm font-semibold">Industry</span>
                  </div>
                  <p className="text-slate-800 font-medium">{profile.sector}</p>
                  <p className="text-slate-600 text-sm">{profile.industry}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Users size={18} />
                    <span className="text-sm font-semibold">Leadership</span>
                  </div>
                  <p className="text-slate-800 font-medium">{profile.ceo || 'N/A'}</p>
                  <p className="text-slate-600 text-sm">CEO</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-2">
                    <Users size={18} />
                    <span className="text-sm font-semibold">Employees</span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {profile.fullTimeEmployees ? Number(profile.fullTimeEmployees).toLocaleString() : 'N/A'}
                  </p>
                  <p className="text-slate-600 text-sm">Full-time</p>
                </div>
              </div>

              {/* Description - Notebook Style */}
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-amber-200 shadow-inner">
                <div className="border-b-2 border-amber-200 bg-amber-100 px-4 py-2">
                  <h3 className="font-bold text-amber-900 text-lg">Company Description</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4 text-slate-700 leading-relaxed font-serif text-base"
                       style={{
                         backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f59e0b20 31px, #f59e0b20 32px)',
                         minHeight: '200px'
                       }}>
                    {profile.description ? (
                      profile.description.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="text-justify">
                          {paragraph}
                        </p>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">No description available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <MapPin size={18} />
                    <span className="text-sm font-semibold">Address</span>
                  </div>
                  <div className="text-slate-700 text-sm space-y-1">
                    {profile.address && <p>{profile.address}</p>}
                    {(profile.city || profile.state || profile.zip) && (
                      <p>{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ')}</p>
                    )}
                    {profile.country && <p>{profile.country}</p>}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-slate-600 mb-3">
                    <Globe size={18} />
                    <span className="text-sm font-semibold">Contact</span>
                  </div>
                  <div className="text-slate-700 text-sm space-y-2">
                    {profile.website && (
                      <a
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Globe size={16} />
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    {profile.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        {profile.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-600 text-white rounded-lg font-semibold
                       hover:bg-slate-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
