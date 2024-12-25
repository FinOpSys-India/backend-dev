const multer = require('multer');
const { fetchAllInvoices, updateInvoiceStatus, fetchAllDeclineInvoices, declineInvoice, getInvoiceByCaseId } = require('../models/model');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const getInvoices = (req, res) => {
  const { role,currentPage } = req.query;
    fetchAllInvoices(role,currentPage,(err, rows) => { // Call fetchAllInvoices without parameters
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
                declineDate:row.DECLINE_DATE,
                declineReason:row.DECLINE_REASON,
                date:row.DATE
            }));
            res.status(200).json(invoices);
        }
    });
};

const getIndividualInvoice = (req, res)=>{
  const caseId = req.params.caseId;
  getInvoiceByCaseId(caseId, (err,rows)=>{
    if(err){
      res.status(500).json({error:'Error executing query'});
    }
    if(rows[0]){
      const invoice = {
        caseId: rows[0].CASE_ID,
        billId: rows[0].BILL_ID,
        customerId: rows[0].CUSTOMER_ID,
        vendorId: rows[0].VENDOR_ID,
        vendorName: rows[0].VENDOR_NAME,
        billDate: rows[0].BILL_DATE,
        dueDate: rows[0].DUE_DATE,
        amount: rows[0].AMOUNT,
        balanceAmount: rows[0].BALANCE_AMOUNT,
        paid: rows[0].PAID,
        status: rows[0].STATUS,
        inboxMethod: rows[0].INBOX_METHOD,
        receivingDate: rows[0].RECEIVING_DATE,
        department: rows[0].DEPARTMENT,
        glCode: rows[0].GL_CODE,
        declineDate:rows[0].DECLINE_DATE,
        declineReason:rows[0].DECLINE_REASON,
        date:rows[0].DATE,
        billData: rows[0].BILL_DATA.toString('base64')
    };
    res.status(200).json(invoice);
    }
  })
}

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
            res.status(200).json(invoices);
        }
    });
};


// ------------------accpet the stuatus-------------------
 const AQSectionAccept= (req, res) => {
    const { invoiceId, role} = req.body; 
    console.log(invoiceId+ ' '+role);
  
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID' });
    }
  
    // Call the model function to update the status if it's pending
  updateInvoiceStatus(invoiceId, role, (error, results) => {
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
    const { invoiceId, role, declineReason } = req.body; 
  
    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID and status are required.' });
    }
  
    
    declineInvoice(invoiceId, role, declineReason, (error, results) => {
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
    getDeclineInvoices,
    getIndividualInvoice
};
