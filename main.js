const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const mdSigns = {
    '**': ['<b>', '</b>'],
    '_': ['<i>', '</i>'],
    '`': ['<tt>', '</tt>']
};

const processMarkdownFile = (pathToMd, outputPath) => {
    if (!pathToMd) {
        console.error('Error: No path to the Markdown file provided.');
        rl.close();
        return;
    }

    fs.readFile(pathToMd, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file: ${err}`);
            rl.close();
            return;
        }

        const lines = data.split(/\r\n\s*\n/); // paragraphing
        const paragraphs = lines.map(ln => `<p>${ln}</p>`);
        const words = paragraphs.map(prgrph => prgrph.split(/[\s\r\n]+/)).flat();

        const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let pref = false;
        let star = 0;
        let underline = 0;
        let literal = 0;
        let preformatted = 0;

        const htmlTags = words.map(wrd => {
            let htmlTag = wrd;

            if (wrd.includes('```')) {
                if (pref) {
                    htmlTag = htmlTag.replace(/```/g, '</pre>');
                    preformatted--;
                } else {
                    htmlTag = htmlTag.replace(/```/g, '<pre>');
                    preformatted++;
                }
                pref = !pref;
                return htmlTag;
            }

            if (!pref) {
                for (const [key, [openingTag, closingTag]] of Object.entries(mdSigns)) {
                    const escapedKey = escapeRegExp(key);
                    const regexStart = new RegExp(`^${escapedKey}`);
                    const regexEnd = new RegExp(`${escapedKey}$`);

                    if (htmlTag.startsWith(key)) {
                        htmlTag = htmlTag.replace(regexStart, openingTag);
                        if (key === '**') star++;
                        if (key === '_') underline++;
                        if (key === '`') literal++;
                    }

                    if (htmlTag.endsWith(key)) {
                        htmlTag = htmlTag.replace(regexEnd, closingTag);
                        if (key === '**') star--;
                        if (key === '_') underline--;
                        if (key === '`') literal--;
                    }
                }
            }

            return htmlTag;
        });

        // Checking for errors
        if (star !== 0 || underline !== 0 || literal !== 0 || preformatted !== 0) {
            console.error('Error: Some tags were not properly closed/opened');
        } else {
            const htmlContent = htmlTags.join(' ');

            if (outputPath) {
                fs.writeFile(outputPath, htmlContent, err => {
                    if (err) {
                        console.error(`File write error: ${err}`);
                    } else {
                        console.log(`The result was successfully saved to the file: ${outputPath}`);
                    }
                    rl.close();
                });
            } else {
                console.log(htmlContent);
                rl.close();
            }
        }
    });
};

// Getting command line arguments
const args = process.argv.slice(2);
const pathToMd = args[0];
let outputPath = null;

const outIndex = args.indexOf('--out');
if (outIndex !== -1 && outIndex + 1 < args.length) {
    outputPath = args[outIndex + 1];
}

processMarkdownFile(pathToMd, outputPath);
