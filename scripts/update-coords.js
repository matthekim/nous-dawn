const fs = require('fs');

// Read CSV
const csv = fs.readFileSync('shops-nous.csv', 'utf8');
const lines = csv.trim().split('\n').slice(1); // skip header

// Parse CSV into shops array
const shops = lines.map(line => {
  const parts = line.split(',');
  
  return {
    shop: parts[0],
    address: parts[1],
    zip: parts[2],
    city: parts[3],
    country: parts[4],
    lat: parts[5],
    long: parts[6],
    url: parts[7] ? (parts[7].startsWith('http') ? parts[7] : 'https://' + parts[7]) : ''
  };
});

// Read existing JSON
const jsonPath = 'templates/page.retailers.json';
let jsonContent = fs.readFileSync(jsonPath, 'utf8');
// Remove comment block at start
jsonContent = jsonContent.replace(/\/\*[\s\S]*?\*\/\s*/, '');
const json = JSON.parse(jsonContent);

// Get the retailers section
const retailersSection = Object.keys(json.sections).find(k => json.sections[k].type === 'retailers-data');

// Clear existing blocks and create new ones
const newBlocks = {};
const blockOrder = [];

shops.forEach((shop, i) => {
  const blockId = 'retailer_' + Math.random().toString(36).substr(2, 6);
  blockOrder.push(blockId);
  newBlocks[blockId] = {
    type: 'retailer',
    settings: {
      shop: shop.shop,
      address: shop.address,
      zip: shop.zip,
      city: shop.city,
      country: shop.country,
      lat: shop.lat,
      long: shop.long,
      url: shop.url
    }
  };
});

// Update the JSON
json.sections[retailersSection].blocks = newBlocks;
json.sections[retailersSection].block_order = blockOrder;

// Write back
fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
console.log('Updated ' + shops.length + ' retailers with new coordinates');
