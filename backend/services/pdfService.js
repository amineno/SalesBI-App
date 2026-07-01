const PDFDocument = require('pdfkit');
const logger = require('../utils/logger');

class PDFService {
    async generateInvoice(order, customer, items) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            try {
                // Header
                doc.fillColor('#444444')
                   .fontSize(20)
                   .text('SALESBI ENTERPRISE', 110, 57)
                   .fontSize(10)
                   .text('123 Enterprise Way', 200, 65, { align: 'right' })
                   .text('London, UK, EC1A 1BB', 200, 80, { align: 'right' })
                   .moveDown();

                // Divider
                doc.strokeColor('#aaaaaa')
                   .lineWidth(1)
                   .moveTo(50, 115)
                   .lineTo(550, 115)
                   .stroke();

                // Invoice Info
                doc.fontSize(12)
                   .text(`Invoice Number: INV-${order.id}`, 50, 130)
                   .text(`Invoice Date: ${new Date(order.order_date).toLocaleDateString()}`, 50, 145)
                   .text(`Order Total: $${order.total_amount.toFixed(2)}`, 50, 160)
                   .text(`Payment Status: ${order.payment_status.toUpperCase()}`, 50, 175)
                   .moveDown();

                // Customer Info
                doc.text('Bill To:', 300, 130)
                   .text(customer.full_name, 300, 145)
                   .text(customer.email, 300, 160)
                   .text(customer.phone || '', 300, 175)
                   .moveDown();

                // Items Table Header
                const tableTop = 230;
                doc.font('Helvetica-Bold');
                this.generateTableRow(doc, tableTop, 'Item', 'Quantity', 'Unit Price', 'Total');
                this.generateHr(doc, tableTop + 20);
                doc.font('Helvetica');

                // Items Table Rows
                let position = tableTop + 30;
                items.forEach(item => {
                    this.generateTableRow(
                        doc, 
                        position, 
                        item.product_name, 
                        item.quantity.toString(), 
                        `$${item.unit_price.toFixed(2)}`, 
                        `$${item.total_price.toFixed(2)}`
                    );
                    this.generateHr(doc, position + 20);
                    position += 30;
                });

                // Footer
                doc.fontSize(10)
                   .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

                doc.end();
            } catch (err) {
                logger.error('PDF Generation failed', { error: err.message });
                reject(err);
            }
        });
    }

    generateTableRow(doc, y, item, quantity, price, lineTotal) {
        doc.fontSize(10)
           .text(item, 50, y)
           .text(quantity, 280, y, { width: 90, align: 'right' })
           .text(price, 370, y, { width: 90, align: 'right' })
           .text(lineTotal, 0, y, { align: 'right' });
    }

    generateHr(doc, y) {
        doc.strokeColor('#eeeeee')
           .lineWidth(1)
           .moveTo(50, y)
           .lineTo(550, y)
           .stroke();
    }
}

module.exports = new PDFService();
