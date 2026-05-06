const { execSync } = require('child_process');
try {
  execSync('npx eslint . --format json', { encoding: 'utf8' });
} catch (e) {
  const data = JSON.parse(e.stdout);
  data.forEach(f => { 
    if(f.errorCount>0 || f.warningCount>0) { 
      console.log('\n'+f.filePath); 
      f.messages.forEach(m => console.log('  Line ' + m.line + ': ' + m.ruleId + ' - ' + m.message)) 
    } 
  });
}
