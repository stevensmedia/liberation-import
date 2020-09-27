const cheerio = require('cheerio');
const fs = require('fs').promises;
const glob = require('glob');

function processArticle(html) {
	var $ = cheerio.load(html);
}

function getFiles(globstr) {
	return new Promise(function(resolve, reject) {
		glob(globstr, {}, function(error, files) {
			if(error) {
				reject(error);
			} else {
				resolve(files);
			}
		});
	});
}

async function main() {
	var target = process.argv.slice(-1)[0];

	try {
		var files = await getFiles(target);
	} catch(e) {
		console.log(`Error getting files: ${e}`);
		return;
	}

	files.forEach(async function(file) {
		var html = false;
		try {
			html = await fs.readFile(file);
		} catch(e) {
			console.log(`Error getting file ${file}: ${e}`);
			return;
		}

		try {
			var processed = await processArticle(html);
		} catch(e) {
			console.log(`Error processing file ${file}: ${e}`);
			return;
		}
	});
}

main();
