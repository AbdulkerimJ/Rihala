const fs = require('fs');
const files = [
  'tests/supplier-cross-module.test.js',
  'tests/supplier-validation.test.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/date:/g, 'paymentDate:');
  content = content.replace(/date ===/g, 'paymentDate ===');
  fs.writeFileSync(file, content);
});
console.log("Tests updated.");
