const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Zaidan\\Desktop\\TESTCLAUDE\\TugasCynmatic\\artifacts\\ecommerce\\src\\pages\\AdminPage.tsx', 'utf8');

let openDivs = 0;
let closeDivs = 0;

// This is a very crude way to count, but might help
const openMatch = content.match(/<div(\s|>)/g) || [];
const closeMatch = content.match(/<\/div>/g) || [];

console.log(`Open divs: ${openMatch.length}`);
console.log(`Close divs: ${closeMatch.length}`);

// Count other tags too
const tags = ['div', 'button', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'section', 'header', 'footer', 'main', 'form', 'select', 'input', 'label', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];

tags.forEach(tag => {
    const open = (content.match(new RegExp(`<${tag}(\\s|>)`, 'g')) || []).length;
    const close = (content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close && tag !== 'input') {
        console.log(`Tag mismatch: <${tag}>: ${open}, </${tag}>: ${close}`);
    }
});
