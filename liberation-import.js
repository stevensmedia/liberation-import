const cheerio = require('cheerio');
const child_process = require('child_process');
const fs = require('fs').promises;
const glob = require('glob');
const path = require('path');

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

async function createPage(doc, title, wp, ssh) {
	return new Promise(function(resolve, reject) {
		var opts = {
			stdio: 'pipe',
		};
		var args = [
			'--post_author=1',
			`--post_title=${title}`,
			'--post_status=publish',
			'--post_type=page',
			`--ssh=${ssh}`,
			'post',
			'create',
			'-',
		];
		wpcli = child_process.spawn(wp, args, opts);

		var dataHandler = function(data) {
			console.log(data.toString('utf-8'));
		};
		wpcli.stdout.on('data', dataHandler);
		wpcli.stderr.on('data', dataHandler);

		var exitHandler = function(code, signal) {
			if(code) {
				reject(`wp-cli returned code ${code} and/or signal ${signal} for ${title}`);
			} else {
				resolve();
			}
		};
		wpcli.on('exit', exitHandler);
		wpcli.on('close', exitHandler);

		wpcli.on('disconnect', function() {
			console.log(`wp-cli disconnected for ${title}`);
		});
		wpcli.on('error', function(error) {
			reject(`wp-cli error ${code} for ${title}`);
		});

		wpcli.stdin.write(Buffer.from(doc, 'utf8'));
		wpcli.stdin.end();
	});
}

async function main() {
	var target = process.argv.slice(-3)[0];
	var wp = process.argv.slice(-2)[0];
	var ssh = process.argv.slice(-1)[0];

	try {
		var files = await getFiles(target);
	} catch(e) {
		console.log(`Error getting files: ${e}`);
		return;
	}

	files.forEach(async function(file) {
		var name = path.basename(file, '.html');
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

		try {
			await createPage(doc, name, wp, ssh);
			console.log(`Done with ${file}`);
		} catch(e) {
			console.log(`Error creating post for file ${file}: ${e}`);
			return;
		}
	});
}

main();
