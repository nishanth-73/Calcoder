const fs = require('fs');
let content = fs.readFileSync('app/finance/income-tax-calculator/page.tsx', 'utf8');

// The string contains 'â€"' which is breaking the JS string.
content = content.replace(/â€"/g, '-');
content = content.replace(/â€“/g, '-');
content = content.replace(/â€”/g, '-');
content = content.replace(/â‚¹/g, '₹');
content = content.replace(/Â£/g, '£');
content = content.replace(/Ã—/g, '×');
content = content.replace(/âˆ’/g, '-');

fs.writeFileSync('app/finance/income-tax-calculator/page.tsx', content);
console.log('Fixed file');
