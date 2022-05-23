function processFile(filename) {
    let source;
    if (filename) {
    source = require('fs').createReadStream(filename).on('error', ()=>{
            console.error("Couldn't open file.");
            process.exit(1);
        });
    } else {
        source = process.stdin;
    }
    return new Promise((resolve, reject) => {
        source.pipe(require('JSONStream').parse('features.*'))
        .on('data', data => { 
            console.log(JSON.stringify(data)); 
        
        })
        .on('error', e => { 
            console.error(e);
            reject(e);
        }).on('end', resolve)
    });
}

module.exports.processAll = async (source) =>{
    if (true) {
        processFile(source)
    } else {
        try {
            return source.forEach(async filename => {
                await processFile(filename)
            });
        } catch (error) {
            console.log(error); 
        }

    }
}





