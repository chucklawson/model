// ============================================
// Portfolio Manager Component
// ============================================
import { useState } from 'react';
import type { Schema } from '../../amplify/data/resource';
import { ArrowLeft, Plus, Trash2, Briefcase } from 'lucide-react';
import type { Portfolio } from '../types';
import { generateClient } from 'aws-amplify/data';

interface Props {
  portfolios: Portfolio[];
  onClose: () => void;
}

export default function PortfolioManager({ portfolios, onClose }: Props) {
  const client = generateClient<Schema>();
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newPortfolioDescription, setNewPortfolioDescription] = useState('');

  const handleCreatePortfolio = async () => {
    // Validate name
    if (!newPortfolioName.trim()) {
      alert('Portfolio name cannot be empty');
      return;
    }

    // Check for duplicates
    if (portfolios.some(p => p.name === newPortfolioName.trim())) {
      alert('A portfolio with this name already exists');
      return;
    }

    try {
      await client.models.Portfolio.create({
        name: newPortfolioName.trim(),
        description: newPortfolioDescription.trim(),
      });

      // Reset form
      setNewPortfolioName('');
      setNewPortfolioDescription('');
    } catch (err) {
      console.error('Error creating portfolio:', err);
      alert('Failed to create portfolio');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    // Prevent deleting last portfolio
    if (portfolios.length <= 1) {
      alert('Cannot delete the last portfolio. At least one portfolio must exist.');
      return;
    }

    try {
      // Get count of lots in this portfolio
      const { data: lots } = await client.models.TickerLot.list();
      const lotsInPortfolio = lots.filter(lot =>
        lot.portfolios && lot.portfolios.includes(portfolioName)
      );
      const lotCount = lotsInPortfolio.length;

      const confirmMsg = lotCount > 0
        ? `Portfolio "${portfolioName}" is used by ${lotCount} lots. Delete it anyway? (Lots will remain in their other portfolios)`
        : `Delete portfolio "${portfolioName}"?`;

      if (!confirm(confirmMsg)) return;

      // Remove this portfolio from all lots that have it
      for (const lot of lotsInPortfolio) {
        const updatedPortfolios = lot.portfolios.filter(p => p !== portfolioName);

        // If lot would have no portfolios, assign to Default
        if (updatedPortfolios.length === 0) {
          updatedPortfolios.push('Default');
        }

        await client.models.TickerLot.update({
          id: lot.id,
          portfolios: updatedPortfolios,
        });
      }

      // Then delete the portfolio
      await client.models.Portfolio.delete({ id: portfolioId });
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      alert('Failed to delete portfolio');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Briefcase size={28} />
              Manage Portfolios
            </h2>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Portfolio Form */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 rounded-xl border-2 border-purple-300">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Add New Portfolio</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Portfolio Name *
                </label>
                <input
                  type="text"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Retirement, Trading, Main"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newPortfolioDescription}
                  onChange={(e) => setNewPortfolioDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="e.g., Long-term holdings"
                />
              </div>
            </div>
            <button
              onClick={handleCreatePortfolio}
              className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Plus size={20} />
              Create Portfolio
            </button>
          </div>

          {/* Portfolio List */}
          <div>
            <h3 className="text-lg font-bold text-slate-700 mb-4">Your Portfolios</h3>
            <div className="space-y-3">
              {portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="flex items-center justify-between p-4 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Briefcase size={20} className="text-purple-600" />
                    <div>
                      <h4 className="font-bold text-slate-800">{portfolio.name}</h4>
                      {portfolio.description && (
                        <p className="text-sm text-slate-600">{portfolio.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                    title="Delete portfolio"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {portfolios.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No portfolios yet. Create your first portfolio above!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
