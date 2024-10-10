const multer = require('multer');
const { fetchAllInvoices, updateInvoiceStatusIfPending, fetchAllDeclineInvoices } = require('../models/model');
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



const getDeclineInvoices = (req, res) => {
    fetchAllDeclineInvoices((err, rows) => { // Call fetchAllInvoices without parameters
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


// ------------------accpet the stuatus-------------------
 const AQSectionAccept= (req, res) => {
    const { invoiceId, status } = req.body; 

    console.log(invoiceId)
    console.log(status)
  
    if (!invoiceId || !status) {
      return res.status(400).json({ message: 'Invoice ID and status are required.' });
    }
  
    // Call the model function to update the status if it's pending
  updateInvoiceStatusIfPending(invoiceId, status, (error, results) => {
    if (error) {
      if (error.message === 'Invoice can only be updated if the status is pending') {
        return res.status(400).json({ message: error.message });
      }
      console.log('Error updating invoice status nnlkjbhvfgf:', error);
      return res.status(500).json({ message: 'Status is already approved/ declined !' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }

    console.error('updating invoice:', results);
    console.error('Error ', error);

    return res.status(200).json({ message: 'Invoice status updated successfully.' });
  });
};








// ------------------Decline the stuatus-------------------
const AQSectionDecline= (req, res) => {
    const { invoiceId, status } = req.body; 

    console.log(invoiceId)
    console.log(req.body)
  
    if (!invoiceId || !status) {
      return res.status(400).json({ message: 'Invoice ID and status are required.' });
    }
  
    
  updateInvoiceStatusIfPending(invoiceId, status, (error, results) => {
    if (error) {
      if (error.message === 'Invoice can only be updated if the status is pending') {
        return ({ message: error });
      }
      console.log('Error updating invoice status:', error);
      return res.status(500).json({ message: 'Status is not pending' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Invoice not found.' });
    }


    console.log('Error updating invoice status:', results);

    return res.status(200).json({ message: 'Invoice status updated successfully.' });
  });
};

module.exports = {
    getInvoices,
    AQSectionAccept,
    AQSectionDecline,
    getDeclineInvoices
};
