const cheerio = require('cheerio');
const fs = require('fs').promises;
const glob = require('glob');

function createDocument(str) {
	var $ = cheerio.load('<html><body></body></html>');
	var lines = str.split('\n\n');
	lines.forEach(function(line) {
		$('body').append($('<p></p>').text(line));
	});
	return $('body').html();
}

function processArticle(html) {
	var $ = cheerio.load(html);
	var text = '';
	$('section[class="yaqOZd"]').find('p').each(function(i, el) {
		var t = $(el).text();
		if(typeof t == 'string' &&
		   t != '[Email]') {
			text += t;
			text += "\n\n";
		}
	});
	return text;
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
		var name = file.replace(/\.html$/, '');
		var html = false;
		try {
			html = await fs.readFile(file);
		} catch(e) {
			console.log(`Error getting file ${file}: ${e}`);
			return;
		}

		try {
			var processed = processArticle(html);
		} catch(e) {
			console.log(`Error processing file ${file}: ${e}`);
			return;
		}

		try {
			var doc = createDocument(processed);
		} catch(e) {
			console.log(`Error creating document for file ${file}: ${e}`);
			return;
		}
	});
}

main();
