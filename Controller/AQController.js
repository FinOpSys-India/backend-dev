const multer = require('multer');
const { fetchAllInvoices } = require('../models/model');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const getInvoices = (req, res) => {
    fetchAllInvoices((err, rows) => { // Call fetchAllInvoices without parameters
        if (err) {
            console.error('Error executing query: ' + err.message);
            res.status(500).json({ error: 'Error executing query' });
        } else {
            const invoices = rows.map((row) => ({
                caseId: row.CASE_ID,
                billId: row.BILL_ID,
                customerId: row.CUSTOMER_ID,
                vendorId: row.VENDOR_ID,
                vendorName: row.VENDOR_NAME,
                billDate: row.BILL_DATE,
                dueDate: row.DUE_DATE,
                amount: row.AMOUNT,
                balanceAmount: row.BALANCE_AMOUNT,
                paid: row.PAID,
                status: row.STATUS,
                inboxMethod: row.INBOX_METHOD,
                receivingDate: row.RECEIVING_DATE,
                department: row.DEPARTMENT,
                glCode: row.GL_CODE,
            }));
            console.log(invoices);
            res.status(200).json(invoices);
        }
    });
};


//  const AQSectionAccept= (req, res) => {
//     const { invoiceId, status } = req.body;  // Get invoiceId and status from the request body
  
//     // Check if both invoiceId and status are provided
//     if (!invoiceId || !status) {
//       return res.status(400).json({ message: 'Invoice ID and status are required.' });
//     }
  
//     // SQL query to update the invoice status
//     const query = `UPDATE Invoice SET status = ? WHERE case_id = ?`;
  
//     // Execute the query
//     db.execute(query, [status, invoiceId], (error, results) => {
//       if (error) {
//         console.error('Error updating invoice status:', error);
//         return res.status(500).json({ message: 'Database error while updating status.' });
//       }
  
//       if (results.affectedRows === 0) {
//         return res.status(404).json({ message: 'Invoice not found.' });
//       }
  
//       return res.status(200).json({ message: 'Invoice status updated successfully.' });
//     });
//   };


module.exports = {
    getInvoices,
    // AQSectionAccept
};
