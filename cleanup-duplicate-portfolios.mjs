// ============================================
// Cleanup Script: Remove Duplicate Portfolios
// ============================================
// This script removes duplicate portfolio records with the same name,
// keeping only the oldest one (first created).

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./amplify_outputs.json', 'utf-8'));

Amplify.configure(config);
const client = generateClient();

async function cleanupDuplicatePortfolios() {
  console.log('🔍 Fetching all portfolios...');

  try {
    const { data: portfolios } = await client.models.Portfolio.list();

    if (!portfolios || portfolios.length === 0) {
      console.log('No portfolios found.');
      return;
    }

    console.log(`Found ${portfolios.length} total portfolio records.`);

    // Group portfolios by name
    const portfoliosByName = new Map();

    portfolios.forEach(portfolio => {
      if (!portfolio) return;

      const name = portfolio.name;
      if (!portfoliosByName.has(name)) {
        portfoliosByName.set(name, []);
      }
      portfoliosByName.get(name).push(portfolio);
    });

    // Find duplicates
    const duplicates = Array.from(portfoliosByName.entries())
      .filter(([_, portfolioList]) => portfolioList.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate portfolios found!');
      return;
    }

    console.log(`\n⚠️  Found ${duplicates.length} portfolio name(s) with duplicates:`);

    for (const [name, portfolioList] of duplicates) {
      console.log(`\n📂 Portfolio: "${name}" (${portfolioList.length} records)`);

      // Sort by createdAt to keep the oldest
      const sorted = portfolioList.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`  ✓ Keeping: ID ${toKeep.id} (created: ${toKeep.createdAt})`);
      console.log(`  ✗ Deleting ${toDelete.length} duplicate(s):`);

      for (const portfolio of toDelete) {
        console.log(`    - ID ${portfolio.id} (created: ${portfolio.createdAt})`);

        try {
          await client.models.Portfolio.delete({ id: portfolio.id });
          console.log(`    ✅ Deleted successfully`);
        } catch (err) {
          console.error(`    ❌ Failed to delete:`, err);
        }
      }
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicatePortfolios();
