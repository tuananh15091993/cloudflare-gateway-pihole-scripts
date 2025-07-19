import { writeFile, readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Parse URLs from environment variable with proper line ending handling
 */
export function parseUrls(urlString) {
  if (!urlString || typeof urlString !== 'string') {
    return [];
  }
  
  return urlString
    .split(/\r?\n/) // Handle both \n and \r\n line endings
    .map(url => url.trim()) // Remove whitespace
    .filter(url => {
      // Filter out empty lines, lines with only \r, and invalid URLs
      if (!url || url === '' || /^[\r\n\s]*$/.test(url)) {
        return false;
      }
      // Basic URL validation
      try {
        new URL(url);
        return true;
      } catch {
        console.warn(`Invalid URL skipped: ${url}`);
        return false;
      }
    });
}

/**
 * Download files from URLs and combine content
 */
export async function downloadFiles(urls, outputPath) {
  console.log('Processing URLs:', urls);
  
  // Parse and validate URLs
  const validUrls = Array.isArray(urls) ? urls : parseUrls(urls);
  
  if (validUrls.length === 0) {
    console.warn('No valid URLs found to download');
    return;
  }

  console.log(`Downloading from ${validUrls.length} URLs...`);
  
  const results = [];
  
  for (const url of validUrls) {
    try {
      console.log(`Downloading: ${url}`);
      const response = await fetch(url.trim());
      
      if (!response.ok) {
        console.error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const content = await response.text();
      results.push(content);
      console.log(`✓ Downloaded ${url} (${content.length} bytes)`);
      
    } catch (error) {
      console.error(`Error downloading ${url}:`, error.message);
    }
  }
  
  // Combine all downloaded content
  const combinedContent = results.join('\n');
  
  // Write to output file
  await writeFile(outputPath, combinedContent, 'utf8');
  console.log(`✓ Saved combined content to ${outputPath} (${combinedContent.length} bytes)`);
}

/**
 * Read and parse domains from file
 */
export async function parseDomains(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    const domains = content
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => {
        // Skip empty lines and comments
        if (!line || line.startsWith('#') || line.startsWith('!') || line.startsWith('[')) {
          return false;
        }
        
        // Handle different formats (hosts file, adblock, etc.)
        let domain = line;
        
        // Extract domain from hosts format (0.0.0.0 domain.com or 127.0.0.1 domain.com)
        if (/^(0\.0\.0\.0|127\.0\.0\.1)\s+/.test(line)) {
          domain = line.split(/\s+/)[1];
        }
        
        // Extract domain from adblock format (||domain.com^)
        if (line.startsWith('||') && line.includes('^')) {
          domain = line.slice(2, line.indexOf('^'));
        }
        
        // Basic domain validation
        if (domain && /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\./.test(domain)) {
          return true;
        }
        
        return false;
      })
      .map(line => {
        // Extract clean domain
        let domain = line;
        if (/^(0\.0\.0\.0|127\.0\.0\.1)\s+/.test(line)) {
          domain = line.split(/\s+/)[1];
        }
        if (line.startsWith('||') && line.includes('^')) {
          domain = line.slice(2, line.indexOf('^'));
        }
        return domain.toLowerCase();
      });
    
    // Remove duplicates
    return [...new Set(domains)];
    
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}
