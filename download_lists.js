#!/usr/bin/env node

import { downloadFiles } from './lib/utils.js'
import { join } from 'path'

const LISTS_DIR = 'lists';

async function downloadLists(listType) {
  const envVar = listType === 'allowlist' ? 'ALLOWLIST_URLS' : 'BLOCKLIST_URLS';
  const filename = `${listType}.txt`;
  const outputPath = join(LISTS_DIR, filename);
  
  console.log(`\n=== Downloading ${listType} ===`);
  
  try {
    const urlsString = process.env[envVar];
    
    if (!urlsString || urlsString.trim() === '') {
      console.log(`No URLs configured for ${listType} (${envVar} is empty)`);
      return;
    }
    
    console.log(`Environment variable ${envVar}:`, urlsString);
    
    // Download and save files
    await downloadFiles(urlsString, outputPath);
    
    console.log(`✅ Successfully downloaded ${listType}`);
    
  } catch (error) {
    console.error(`❌ An error occurred while processing ${filename}:`);
    console.error(error);
    
    // Print debug information
    if (process.env[envVar]) {
      console.log('\nDEBUG - Raw environment variable:');
      console.log(JSON.stringify(process.env[envVar]));
      
      console.log('\nDEBUG - Character codes:');
      const chars = [...process.env[envVar]].map(char => `${char}(${char.charCodeAt(0)})`);
      console.log(chars.join(', '));
    }
    
    process.exit(1);
  }
}

// Main execution
async function main() {
  const listType = process.argv[2];
  
  if (!listType) {
    console.error('Usage: node download_lists.js <allowlist|blocklist>');
    process.exit(1);
  }
  
  if (!['allowlist', 'blocklist'].includes(listType)) {
    console.error('List type must be either "allowlist" or "blocklist"');
    process.exit(1);
  }
  
  try {
    await downloadLists(listType);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
