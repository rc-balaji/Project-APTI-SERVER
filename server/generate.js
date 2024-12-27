const fs = require("fs");
const PDFDocument = require("pdfkit");

// Sample JSON data
const jsonData = {
  rack_id: "WR002",
  master: [72, 231, 41, 161, 144, 44],
  mac: [176, 167, 50, 43, 142, 152],
  bins: [
    {
      color: [17, 0, 255],
      led_pin: 4,
      bin_id: "WR002_01",
      button_pin: 15,
      schedules: [
        { enabled: false, time: "05:08", color: [255, 34, 0] },
        { enabled: false, time: "18:21", color: [255, 165, 0] },
      ],
      enabled: true,
      clicked: false,
    },
    {
      color: [238, 255, 0],
      led_pin: 5,
      bin_id: "WR002_02",
      button_pin: 2,
      schedules: [
        { enabled: false, time: "05:08", color: [238, 255, 0] },
        { enabled: false, time: "18:21", color: [0, 128, 0] },
        { enabled: false, time: "18:21", color: [0, 0, 255] },
        { enabled: false, time: "18:21", color: [75, 0, 130] },
        { enabled: false, time: "18:21", color: [238, 130, 238] },
      ],
      enabled: true,
      clicked: false,
    },
  ],
};

// Create a new PDF document
const doc = new PDFDocument();

// Pipe the PDF into a writable stream (create a file)
doc.pipe(fs.createWriteStream("output.pdf"));

// Add a title to the document
doc.fontSize(18).text("Rack Information", { align: "center" }).moveDown(2);

// Add rack ID and MAC Address
doc.fontSize(12).text(`Rack ID: ${jsonData.rack_id}`).moveDown();
doc.text(`MAC Address: ${jsonData.mac.join(":")}`).moveDown();

// Loop through bins and add their data
jsonData.bins.forEach((bin, index) => {
  doc
    .fontSize(14)
    .text(`Bin ${index + 1}: ${bin.bin_id}`)
    .moveDown();
  doc.fontSize(12).text(`- LED Pin: ${bin.led_pin}`).moveDown();
  doc.text(`- Button Pin: ${bin.button_pin}`).moveDown();
  doc.text(`- Enabled: ${bin.enabled}`).moveDown();
  doc.text(`- Clicked: ${bin.clicked}`).moveDown();

  // Schedules
  doc.text("Schedules:").moveDown();
  bin.schedules.forEach((schedule, scheduleIndex) => {
    doc
      .text(
        `  ${scheduleIndex + 1}. Time: ${schedule.time} | Enabled: ${
          schedule.enabled
        } | Color: ${schedule.color.join(", ")}`
      )
      .moveDown();
  });
  doc.moveDown();
});

// Finalize the document
doc.end();

console.log("PDF generated successfully!");
