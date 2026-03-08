const fs = require('fs');
const PDFParser = require("pdf2json");

let pdfParser = new PDFParser(this, 1);

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFileSync('C:\\Users\\sumit\\Downloads\\RevaDates\\pdf_text.txt', pdfParser.getRawTextContent());
    console.log("PDF extraction complete.");
});

pdfParser.loadPDF('C:\\Users\\sumit\\Downloads\\RevaDates\\Fluxbase-Integration-Guide.pdf');
