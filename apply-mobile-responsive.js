/**
 * Script to apply mobile responsive framework to all HTML pages
 * This script adds the mobile responsive CSS and JS to HTML files that don't already have them
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const CSS_LINK = '<link rel="stylesheet" href="css/mobile-responsive.css">';
const JS_SCRIPT = '<script src="js/mobile-nav.js"></script>';
const COMMENT = '<!-- Mobile Responsive Framework -->';

// Find all HTML files
function findHtmlFiles() {
    const htmlFiles = glob.sync('**/*.html', {
        ignore: ['node_modules/**', '.git/**']
    });
    return htmlFiles;
}

// Check if file already has mobile responsive framework
function hasMobileFramework(content) {
    return content.includes('mobile-responsive.css') || content.includes('mobile-nav.js');
}

// Add mobile responsive framework to HTML file
function addMobileFramework(content) {
    // Find the closing </head> tag
    const headCloseIndex = content.indexOf('</head>');
    
    if (headCloseIndex === -1) {
        console.warn('No </head> tag found in file');
        return content;
    }
    
    // Insert the mobile framework before </head>
    const insertion = `    ${COMMENT}\n    ${CSS_LINK}\n    ${JS_SCRIPT}\n`;
    
    return content.slice(0, headCloseIndex) + insertion + content.slice(headCloseIndex);
}

// Process a single HTML file
function processHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        if (hasMobileFramework(content)) {
            console.log(`✓ ${filePath} already has mobile framework`);
            return false;
        }
        
        content = addMobileFramework(content);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Added mobile framework to ${filePath}`);
        return true;
        
    } catch (error) {
        console.error(`✗ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('🚀 Applying mobile responsive framework to HTML files...\n');
    
    const htmlFiles = findHtmlFiles();
    console.log(`Found ${htmlFiles.length} HTML files to process\n`);
    
    let processedCount = 0;
    let errorCount = 0;
    
    htmlFiles.forEach(filePath => {
        try {
            const processed = processHtmlFile(filePath);
            if (processed) {
                processedCount++;
            }
        } catch (error) {
            console.error(`✗ Failed to process ${filePath}:`, error.message);
            errorCount++;
        }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   • ${processedCount} files updated with mobile framework`);
    console.log(`   • ${htmlFiles.length - processedCount - errorCount} files already had framework`);
    if (errorCount > 0) {
        console.log(`   • ${errorCount} files had errors`);
    }
    console.log(`\n✨ Mobile responsive framework application complete!`);
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    findHtmlFiles,
    hasMobileFramework,
    addMobileFramework,
    processHtmlFile,
    main
};