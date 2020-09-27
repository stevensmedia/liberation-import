const cheerio = require('cheerio');
const glob = require('glob');

function processArticle(html) {
	var $ = cheerio.load(html);
}

function getFiles(globstr) {
	return new Promise(function(resolve, reject) {
		glob('*.html', {}, function(error, files) {
			if(error) {
				reject(error);
			} else 
				resolve(files);
			}
		}
	});
}

async function main() {
	try {
		var files = getFiles('*.html');
	} catch(e) {
		console.log(`Error getting files: ${e}`);
		return;
	}
}

main();
