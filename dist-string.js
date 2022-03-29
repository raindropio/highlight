const fs = require('fs')
const source = fs.readFileSync(__dirname+'/dist/highlight.js', 'utf8')
fs.writeFileSync(__dirname+'/dist/highlight.string.js', `export default ${JSON.stringify(source)}`, 'utf8')