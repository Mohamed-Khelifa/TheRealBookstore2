const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function run() {
  const mergedPdf = await PDFDocument.create();
  
  const sourcePdf1 = await PDFDocument.load(fs.readFileSync('test.pdf'));
  const pageToEmbed = sourcePdf1.getPages()[0];
  
  const A4_WIDTH = 595.276;
  const A4_HEIGHT = 841.89;
  
  // Crop the page to the top-left quadrant
  const embeddedPage = await mergedPdf.embedPage(pageToEmbed, {
    left: 0,
    right: A4_WIDTH / 2,
    bottom: A4_HEIGHT / 2,
    top: A4_HEIGHT
  });
  
  const currentPage = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
  
  // Now embeddedPage has width = A4_WIDTH/2 and height = A4_HEIGHT/2
  // Let's place it in 4 quadrants
  
  // top-left
  currentPage.drawPage(embeddedPage, {
    x: 0,
    y: A4_HEIGHT / 2
  });
  
  // top-right
  currentPage.drawPage(embeddedPage, {
    x: A4_WIDTH / 2,
    y: A4_HEIGHT / 2
  });
  
  // bottom-left
  currentPage.drawPage(embeddedPage, {
    x: 0,
    y: 0
  });
  
  // bottom-right
  currentPage.drawPage(embeddedPage, {
    x: A4_WIDTH / 2,
    y: 0
  });
  
  fs.writeFileSync('output-crop2.pdf', await mergedPdf.save());
}
run();
