/**
 * Script to update search components across all HTML pages
 * This replaces old search implementations with the new modern design
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CSS_LINK = '<link rel="stylesheet" href="css/search-component.css">';
const JS_SCRIPT = '<script src="js/search-component.js"></script>';
const NEW_SEARCH_HTML = `            <div class="search-section" data-search-component>
                <!-- Search component will be rendered here by JavaScript -->
            </div>`;

// Patterns to find old search implementations
const OLD_SEARCH_PATTERNS = [
    /<!--[\s\S]*?Search[\s\S]*?-->/gi,
    /<div[^>]*search-wrapper[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi,
    /<div[^>]*search-container[^>]*>[\s\S]*?<\/div>/gi,
    /<section[^>]*search[^>]*>[\s\S]*?<\/section>/gi
];

// Find all HTML files that might have search components
function findSearchPages() {
    const htmlFiles = glob.sync('**/*.html', {
        ignore: ['node_modules/**', '.git/**', 'test-*', 'debug-*']
    });
    
    const searchPages = [];
    
    htmlFiles.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.toLowerCase().includes('search') && 
                (content.includes('search-input') || content.includes('search-wrapper') || 
                 content.includes('search events') || content.includes('Search events'))) {
                searchPages.push(filePath);
            }
        } catch (error) {
            console.warn(`Could not read ${filePath}: ${error.message}`);
        }
    });
    
    return searchPages;
}

// Check if file already has new search component
function hasNewSearchComponent(content) {
    return content.includes('search-component.css') || content.includes('data-search-component');
}

// Add search component assets to head
function addSearchAssets(content) {
    const headCloseIndex = content.indexOf('</head>');
    
    if (headCloseIndex === -1) {
        console.warn('No </head> tag found');
        return content;
    }
    
    // Check if assets are already included
    if (content.includes('search-component.css')) {
        return content;
    }
    
    const insertion = `    <!-- Search Component Assets -->\n    ${CSS_LINK}\n    ${JS_SCRIPT}\n`;
    
    return content.slice(0, headCloseIndex) + insertion + content.slice(headCloseIndex);
}

// Replace old search implementations with new component
function replaceSearchImplementation(content) {
    let updatedContent = content;
    
    // Pattern 1: Find search-wrapper inside search-container
    updatedContent = updatedContent.replace(
        /<div[^>]*class="search-container"[^>]*>\s*<div[^>]*search-wrapper[\s\S]*?<\/div>\s*<\/div>/gi,
        NEW_SEARCH_HTML
    );
    
    // Pattern 2: Find standalone search-wrapper
    updatedContent = updatedContent.replace(
        /<div[^>]*search-wrapper[\s\S]*?<\/div>/gi,
        match => {
            // Only replace if it contains search input
            if (match.includes('search-input') || match.includes('Search events')) {
                return NEW_SEARCH_HTML.trim();
            }
            return match;
        }
    );
    
    // Pattern 3: Find search sections with input elements
    updatedContent = updatedContent.replace(
        /<div[^>]*class="[^"]*search[^"]*"[^>]*>[\s\S]*?<input[^>]*search-input[\s\S]*?<\/div>/gi,
        NEW_SEARCH_HTML
    );
    
    // Pattern 4: Handle specific search forms
    updatedContent = updatedContent.replace(
        /<form[^>]*search[\s\S]*?<\/form>/gi,
        match => {
            if (match.includes('search-input') || match.includes('Search events')) {
                return NEW_SEARCH_HTML.trim();
            }
            return match;
        }
    );
    
    return updatedContent;
}

// Process a single HTML file
function processSearchPage(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalContent = content;
        
        if (hasNewSearchComponent(content)) {
            console.log(`✓ ${filePath} already has new search component`);
            return false;
        }
        
        // Add search component assets
        content = addSearchAssets(content);
        
        // Replace old search implementations
        content = replaceSearchImplementation(content);
        
        // Only write if content changed
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated search component in ${filePath}`);
            return true;
        } else {
            console.log(`→ No search component found to update in ${filePath}`);
            return false;
        }
        
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('🔍 Finding pages with search functionality...\n');
    
    const searchPages = findSearchPages();
    console.log(`Found ${searchPages.length} pages with search functionality:`);
    searchPages.forEach(page => console.log(`  - ${page}`));
    console.log('');
    
    if (searchPages.length === 0) {
        console.log('No search pages found to update.');
        return;
    }
    
    console.log('🚀 Updating search components...\n');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    searchPages.forEach(filePath => {
        try {
            const updated = processSearchPage(filePath);
            if (updated) {
                updatedCount++;
            }
        } catch (error) {
            console.error(`✗ Failed to process ${filePath}:`, error.message);
            errorCount++;
        }
    });
    
    console.log(`\n📊 Update Summary:`);
    console.log(`   • ${updatedCount} pages updated with new search component`);
    console.log(`   • ${searchPages.length - updatedCount - errorCount} pages already up to date`);
    if (errorCount > 0) {
        console.log(`   • ${errorCount} pages had errors`);
    }
    console.log(`\n✨ Search component update complete!`);
    
    // Provide usage instructions
    console.log(`\n📋 Next Steps:`);
    console.log(`   1. Test the updated search components in your browser`);
    console.log(`   2. Customize location options in js/search-component.js if needed`);
    console.log(`   3. Implement actual search functionality by listening for 'searchPerformed' events`);
    console.log(`   4. Style adjustments can be made in css/search-component.css`);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    findSearchPages,
    hasNewSearchComponent,
    addSearchAssets,
    replaceSearchImplementation,
    processSearchPage,
    main
};