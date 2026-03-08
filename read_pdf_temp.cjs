const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('c:\\Users\\sumit\\Downloads\\RevaDates\\Fluxbase-Integration-Guide.pdf');

pdf(dataBuffer).then(function (data) {
    console.log("PDF_TEXT_START");
    console.log(data.text);
    console.log("PDF_TEXT_END");
}).catch(function (err) {
    console.error("Error reading PDF:", err);
});
