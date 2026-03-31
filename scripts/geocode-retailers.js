/**
 * Geocode Retailers Script
 * 
 * Usage: node scripts/geocode-retailers.js
 * 
 * Add your retailers to the 'retailers' array below, then run the script.
 * It will output JSON blocks ready to paste into page.retailers.json
 */

const https = require('https');

// ============================================
// RETAILERS FROM CSV (excluding Exes and Dawance already in system)
// ============================================
const retailers = [
  { shop: "Princess", address: "Lange Gasthuisstraat 12", zip: "2000", city: "Antwerpen", country: "Belgium", url: "https://www.princess.eu" },
  { shop: "Princess", address: "Zeedijk-Het Zoute 807", zip: "8300", city: "Knokke-Heist", country: "Belgium", url: "https://www.princess.eu" },
  { shop: "Kelly", address: "George Brugmannplein 36", zip: "1050", city: "Brussel", country: "Belgium", url: "https://www.kellyshop.be" },
  { shop: "Frau", address: "Dorp-West 114", zip: "9080", city: "Lochristi", country: "Belgium", url: "https://www.frau.boutique" },
  { shop: "John's Boetiek", address: "Kortrijkstraat 50", zip: "9800", city: "Deinze", country: "Belgium", url: "" },
  { shop: "Harlekijn", address: "Onze-Lieve-Vrouwestraat 121", zip: "2800", city: "Mechelen", country: "Belgium", url: "https://www.harlekijnmechelen.be" },
  { shop: "Feliz Concept Store", address: "Wampenberg 23", zip: "2370", city: "Arendonk", country: "Belgium", url: "https://www.felizconceptstore.be" },
  { shop: "Manufactuur", address: "Lembergsesteenweg 136", zip: "9820", city: "Merelbeke-Melle", country: "Belgium", url: "https://www.manufactuur.be" },
  { shop: "Manou", address: "Steenhouwersvest 33", zip: "2000", city: "Antwerpen", country: "Belgium", url: "https://www.manouantwerp.com" },
  { shop: "Caress", address: "Dokter Roosensplein 43", zip: "2930", city: "Brasschaat", country: "Belgium", url: "https://www.caress.be" },
  { shop: "Ko.Shu", address: "Solleveld 30", zip: "9550", city: "Herzele", country: "Belgium", url: "https://www.koshu.be" },
  { shop: "Niinsky Mode", address: "Sint Jacobsstraat 5", zip: "8911 HR", city: "Leeuwarden", country: "Netherlands", url: "https://www.niinsky.nl" },
  { shop: "Heemels", address: "Binnenweg 180", zip: "2101 JS", city: "Heemstede", country: "Netherlands", url: "https://www.heemelsmode.nl" },
  { shop: "Matchbox", address: "1, Psihari str Neo Psihiko", zip: "154 51", city: "Athens", country: "Greece", url: "https://www.matchboxathens.com" },
  { shop: "Orfanidis", address: "27, Kolokotroni str", zip: "105 62", city: "Athens", country: "Greece", url: "" },
  { shop: "La Suite", address: "68, Rue du Vieux Village", zip: "74260", city: "Les Gets", country: "France", url: "" },
  { shop: "Ma Première Boutique", address: "14, Rue du Petit Saint-Jean", zip: "34000", city: "Montpellier", country: "France", url: "https://www.mapremiereboutique.fr" },
  { shop: "Boutique Zazie", address: "25, Rue de la République", zip: "84800", city: "L'Isle-sur-la-Sorgue", country: "France", url: "" },
  { shop: "Luxstore", address: "8, Rue Emmanuel Arène", zip: "20000", city: "Ajaccio", country: "France", url: "https://www.luxstore.fr" },
  { shop: "Titaibi Le Touquet", address: "3, Avenue du Verger", zip: "62520", city: "Le Touquet-Paris-Plage", country: "France", url: "https://www.laboutiquetitaibi.com" },
  { shop: "Titaibi Wimereux", address: "61, Rue Carnot", zip: "62930", city: "Wimereux", country: "France", url: "https://www.laboutiquetitaibi.com" },
  { shop: "Paloca Store", address: "51, Rue de Moscou", zip: "62520", city: "Le Touquet-Paris-Plage", country: "France", url: "https://www.paloca.fr" },
  { shop: "Blush Concept Store", address: "3, Rue des Quatre Chapeaux", zip: "69002", city: "Lyon", country: "France", url: "https://www.blush-conceptstore.com" },
  { shop: "Oxygene", address: "19, Rue des Boulangers", zip: "68100", city: "Mulhouse", country: "France", url: "https://www.boutiqueoxygene.com" },
  { shop: "La Cabane Plaza", address: "1, Boulevard Frédéric Mistral", zip: "83120", city: "Saint-Maxime", country: "France", url: "" },
  { shop: "Fati Fati Concept Store", address: "18, Rue de Sault", zip: "38000", city: "Grenoble", country: "France", url: "" },
  { shop: "Di Mare", address: "Pôle d'activités", zip: "20166", city: "Porticcio", country: "France", url: "" },
  { shop: "La Boutique", address: "32, Rue du Bourg", zip: "21000", city: "Dijon", country: "France", url: "" },
  { shop: "By dé Bo", address: "22, Rue Jacques d'Uzès", zip: "33700", city: "Uzès", country: "France", url: "" },
  { shop: "L'Atelier 31", address: "31, Route de Gordes", zip: "84220", city: "Coustellet", country: "France", url: "" },
  { shop: "Spontini", address: "1, Rue Sainte-Hilaire", zip: "94120", city: "La Varenne Sainte-Hilaire", country: "France", url: "https://www.spontini.fr" },
  { shop: "Paula", address: "93, Avenue de Bourbon", zip: "97460", city: "Saint-Paul", country: "France", url: "" },
  { shop: "Capucine", address: "4, Place du Marché des Trois Six", zip: "34120", city: "Pézenas", country: "France", url: "" },
  { shop: "J'entends le loup Ars", address: "4, Quai de la Prée", zip: "17590", city: "Ars-en-Ré", country: "France", url: "" },
  { shop: "J'entends le loup La Rochelle", address: "17, Rue du Minage", zip: "17000", city: "La Rochelle", country: "France", url: "" },
  { shop: "Snob", address: "45, Rue Marceau", zip: "37000", city: "Tours", country: "France", url: "" },
  { shop: "L'Ylang", address: "18, Rue du Général de Gaulle", zip: "20137", city: "Porto-Vecchio", country: "France", url: "" },
  { shop: "AB33", address: "33, Rue Charlot", zip: "75003", city: "Paris", country: "France", url: "https://www.ab33.fr" },
  { shop: "Club 55", address: "43, Boulevard Patch", zip: "83350", city: "Ramatuelle", country: "France", url: "https://www.club55.fr" },
  { shop: "Nude", address: "16, Boulevard Edouard Baudoin", zip: "06160", city: "Juan-les-Pins", country: "France", url: "" },
  { shop: "Moma", address: "38, Rue des Forges", zip: "21000", city: "Dijon", country: "France", url: "" },
  { shop: "Gipsy James", address: "49, Rue de la liberté", zip: "97150", city: "Saint-Martin", country: "France", url: "" },
  { shop: "Les Cocottes", address: "76, Boulevard du Chaudron", zip: "97490", city: "Saint-Denis", country: "Réunion", url: "" },
  { shop: "La Plaza Cosy", address: "12, Rue Louis Martin", zip: "83420", city: "La Croix-Valmer", country: "France", url: "" },
  { shop: "Tentation", address: "Résidence du Port", zip: "20217", city: "Saint-Florent", country: "France", url: "" },
  { shop: "Alba", address: "Torraccia", zip: "20130", city: "Cargèse", country: "France", url: "" },
  { shop: "Vestiras", address: "Carrer de Sant Pere 2", zip: "17255", city: "Begur", country: "Spain", url: "" },
  { shop: "Mad", address: "Rambla de Catalunya 107", zip: "8008", city: "Barcelona", country: "Spain", url: "" },
  { shop: "Dandelion", address: "Carrer del Tenor Viñas 12", zip: "8021", city: "Barcelona", country: "Spain", url: "" },
  { shop: "Boto & Co", address: "Carrer de Bonavista 3", zip: "8012", city: "Barcelona", country: "Spain", url: "" },
  { shop: "Pour Toi", address: "Carrer de Salvador Lluch 7", zip: "8850", city: "Gavà", country: "Spain", url: "" },
  { shop: "Itsomi", address: "Av. De la Marina 14", zip: "11310", city: "Sotogrande", country: "Spain", url: "" },
  { shop: "BLiNk", address: "Carrer de Ramon Llull 11", zip: "7860", city: "Sant Francesc de Formentera", country: "Spain", url: "" },
  { shop: "Noss", address: "Carrer del Bisbe Azare 2", zip: "7800", city: "Ibiza", country: "Spain", url: "" },
  { shop: "Kala", address: "Carrer del Rosari 29", zip: "7701", city: "Menorca", country: "Spain", url: "" },
  { shop: "Tommy", address: "Carrer de Gràcia 45", zip: "8201", city: "Sabadell", country: "Spain", url: "" },
  { shop: "Il Baco di Seta", address: "Carrer del Comte de Salvatierra 34", zip: "46004", city: "Valencia", country: "Spain", url: "" },
  { shop: "Zoe", address: "C/ de la Nau 28", zip: "46003", city: "Valencia", country: "Spain", url: "" },
  { shop: "Maria Nava", address: "Av. Del Dr. Gadea 19", zip: "3003", city: "Alicante", country: "Spain", url: "" },
  { shop: "Maria Alonso", address: "C. Felipe Gorriti 23 bis", zip: "31004", city: "Pamplona", country: "Spain", url: "" },
  { shop: "Yuppi", address: "Carrer Pintor Domènech i Farré 2-4 A", zip: "8320", city: "El Masnou", country: "Spain", url: "" },
  { shop: "Pez", address: "C. de Reguerros 15", zip: "28004", city: "Madrid", country: "Spain", url: "" },
  { shop: "Leto", address: "C. de Jorge Juan 14", zip: "28001", city: "Madrid", country: "Spain", url: "" },
  { shop: "Cedry", address: "Toribio Etxebarria Kalea 19", zip: "20600", city: "Eibar", country: "Spain", url: "" },
  { shop: "Blanca", address: "Correhuela 17", zip: "37001", city: "Salamanca", country: "Spain", url: "" },
  { shop: "Alberta", address: "Carrer d'Alloza 32", zip: "12001", city: "Castellon", country: "Spain", url: "" },
  { shop: "Mequieres", address: "Calle Ntra. Sra. De la Luz 22A", zip: "11380", city: "Tarifa", country: "Spain", url: "" },
  { shop: "Be On Blue Cadaqués", address: "Plaça del Dr. Pont 6", zip: "17488", city: "Cadaqués", country: "Spain", url: "" },
  { shop: "Be On Blue Calella", address: "Passatge Jimmy Rena 17-19", zip: "17210", city: "Calella de Palafrugell", country: "Spain", url: "" },
  { shop: "India Mon Amour", address: "Carrer de Sant Gaudenci 26", zip: "8870", city: "Sitges", country: "Spain", url: "" },
  { shop: "Global", address: "C/ Asunción 12", zip: "41011", city: "Sevilla", country: "Spain", url: "" },
  { shop: "Safari Blu", address: "Cala Galera box 41/42/43", zip: "58019", city: "Monte Argentario", country: "Italy", url: "" },
  { shop: "Gallery A", address: "Via Abbrescia 83A", zip: "70121", city: "Bari", country: "Italy", url: "" },
  { shop: "The Family Market", address: "Rathausgasse 62", zip: "3011", city: "Bern", country: "Switzerland", url: "" },
  { shop: "Brunello Shoes & Fashion", address: "Kornmarktgasse 5", zip: "6004", city: "Luzern", country: "Switzerland", url: "" },
  { shop: "Boutique Mai", address: "Waldstätterstrasse 19", zip: "6003", city: "Luzern", country: "Switzerland", url: "" },
  { shop: "Pompons", address: "Forchstrasse 186", zip: "8032", city: "Zürich", country: "Switzerland", url: "" },
];

// ============================================
// GEOCODING FUNCTIONS (don't modify below)
// ============================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function geocodeAddress(retailer) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(
      `${retailer.address}, ${retailer.zip} ${retailer.city}, ${retailer.country}`
    );
    
    const options = {
      hostname: 'nominatim.openstreetmap.org',
      path: `/search?format=json&q=${query}&limit=1`,
      method: 'GET',
      headers: {
        'User-Agent': 'NOUS-Shopify-Geocoder/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results.length > 0) {
            resolve({
              ...retailer,
              lat: results[0].lat,
              long: results[0].lon
            });
          } else {
            console.warn(`⚠️  No results for: ${retailer.shop} - ${retailer.address}, ${retailer.city}`);
            resolve({
              ...retailer,
              lat: "",
              long: ""
            });
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function generateBlockId() {
  return 'retailer_' + Math.random().toString(36).substring(2, 8);
}

async function main() {
  console.log('🌍 Geocoding retailers...\n');
  
  const geocodedRetailers = [];
  
  for (const retailer of retailers) {
    console.log(`📍 Geocoding: ${retailer.shop}...`);
    const result = await geocodeAddress(retailer);
    geocodedRetailers.push(result);
    // Nominatim requires 1 second delay between requests
    await delay(1100);
  }

  console.log('\n✅ Done! Here are the JSON blocks to add to page.retailers.json:\n');
  console.log('// Add these to the "blocks" object in retailers_data section:');
  console.log('// ============================================================\n');

  const blocks = {};
  const blockOrder = [];

  geocodedRetailers.forEach(r => {
    const id = generateBlockId();
    blockOrder.push(id);
    blocks[id] = {
      type: "retailer",
      settings: {
        shop: r.shop,
        address: r.address,
        zip: r.zip,
        city: r.city,
        country: r.country,
        lat: r.lat,
        long: r.long,
        url: r.url || ""
      }
    };
  });

  console.log(JSON.stringify(blocks, null, 2));
  
  console.log('\n// Add these IDs to the "block_order" array:');
  console.log('// ==========================================\n');
  console.log(JSON.stringify(blockOrder, null, 2));

  console.log('\n\n📋 Summary:');
  geocodedRetailers.forEach(r => {
    const status = r.lat ? '✅' : '❌';
    console.log(`${status} ${r.shop}: ${r.lat || 'NO COORDS'}, ${r.long || ''}`);
  });
}

main().catch(console.error);
