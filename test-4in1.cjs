const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const mergedPdf = await PDFDocument.create();
  
  const sourcePdf1 = await PDFDocument.load(fs.readFileSync('test.pdf'));
  const sourcePdf2 = await PDFDocument.load(fs.readFileSync('test2.pdf'));
  
  // We have 1 page in test.pdf and 2 pages in test2.pdf (total 3 pages)
  const pagesToEmbed = [];
  
  const [embed1] = await mergedPdf.embedPdf(sourcePdf1, [0]);
  pagesToEmbed.push(embed1);
  const [embed2, embed3] = await mergedPdf.embedPdf(sourcePdf2, [0, 1]);
  pagesToEmbed.push(embed2);
  pagesToEmbed.push(embed3);
  
  const A4_WIDTH = 595.276;
  const A4_HEIGHT = 841.89;
  
  let currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  let idx = 0;
  
  for (const embed of pagesToEmbed) {
    if (idx > 0 && idx % 4 === 0) {
      currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
    }
    const pos = idx % 4;
    // Scale down by 0.5
    // pos 0: top-left
    // pos 1: top-right
    // pos 2: bottom-left
    // pos 3: bottom-right
    
    // Scale is 0.5. So width is A4_WIDTH / 2, height is A4_HEIGHT / 2
    // Top-left: x=0, y=A4_HEIGHT / 2
    // Top-right: x=A4_WIDTH / 2, y=A4_HEIGHT / 2
    // Bottom-left: x=0, y=0
    // Bottom-right: x=A4_WIDTH / 2, y=0
    
    const x = (pos % 2 === 0) ? 0 : A4_WIDTH / 2;
    const y = (pos < 2) ? A4_HEIGHT / 2 : 0;
    
    currentPage.drawPage(embed, {
      x,
      y,
      xScale: 0.5,
      yScale: 0.5
    });
    
    idx++;
  }
  
  fs.writeFileSync('output-4in1.pdf', await mergedPdf.save());
}
run();
