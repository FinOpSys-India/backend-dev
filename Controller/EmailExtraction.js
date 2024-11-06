const Imap = require('imap');
const { insertInvoice } = require('../models/model');
const simpleParser = require('mailparser').simpleParser;

const imapConfig = {
  user: 'psingh@finopsys.ai',  // Hostinger email
  password: 'Prs@89826',
  host: 'imap.hostinger.com',  // Hostinger IMAP server
  port: 993,  // IMAP port for SSL
  tls: true,
};

function bufferToHex(buffer) {
  return buffer.toString('hex').toUpperCase();
}

// List of keywords to look for in email text or subject
const invoiceKeywords = ['Invoice', 'Bill', 'Amount', 'Payment', 'Due', 'Statement', 'Total', 'Balance'];

// Helper function to process emails in a given folder
function processEmails(imap, folderName, res, emails, callback) {
  imap.openBox(folderName, false, (err, box) => {
    if (err) {
      console.error(`Error opening ${folderName} folder:`, err);
      return callback(); // Proceed to the next folder if there's an error
    }

    // Search for unread emails in the folder
    imap.search(['UNSEEN'], (err, results) => {
      if (err) {
        console.error(`Error searching ${folderName}:`, err);
        return callback(); // Proceed to the next folder if there's an error
      }

      if (results.length === 0) {
        // If no unread emails found, call the callback immediately
        console.log(`No unread emails in ${folderName}`);
        return callback();
      }

      const f = imap.fetch(results, { bodies: '', struct: true, markSeen: true});
      let processedCount = 0;  // Counter to track processed emails

      f.on('message', (msg, seqno) => {
        let buffer = ''; // To store the message body stream

        msg.on('body', (stream, info) => {
          stream.on('data', (chunk) => {
            buffer += chunk.toString('utf8');
          });

          stream.once('end', async () => {
            try {
              // Parse the email once the body is fully read
              const parsedEmail = await simpleParser(buffer);
              const attachments = parsedEmail.attachments || [];

              // Filter attachments for PDFs or images
              const filteredAttachments = attachments.filter(att => {
                return att.contentType.includes('application/pdf') || 
                       att.contentType.includes('image/');
              });

              // Check if the email subject or body contains any invoice-related keywords
              const containsKeyword = invoiceKeywords.some(keyword => {
                return (parsedEmail.subject && parsedEmail.subject.includes(keyword)) || 
                       (parsedEmail.text && parsedEmail.text.includes(keyword));
              });

              // Only store and log emails if they have PDF/image attachments and contain relevant keywords
              if (filteredAttachments.length > 0 && containsKeyword) {
                emails.push({
                  subject: parsedEmail.subject || '(No subject)',
                  from: (parsedEmail.from && parsedEmail.from.text) || '(Unknown sender)',
                  date: parsedEmail.date || '(No date)',
                  text: parsedEmail.text || '',  // Optional field
                  attachments: filteredAttachments.map(att => ({
                    fileData: bufferToHex(att.content),
                    filename: att.filename,
                    contentType: att.contentType,
                  })),
                });
                // imap.addFlags(seqno, '\\Seen', (err) => {
                //   if (err) console.log('Error marking message as read:', err);
                //   else console.log(`Email ${seqno} marked as read.`);
                // });
             }
            } catch (err) {
              console.error('Error parsing email:', err);
            } 
            // Increment the counter after processing each email
            processedCount++;
            // Check if all emails have been processed
            if (processedCount === results.length) {
              callback();  // Move to the next folder after all emails are processed
            }
          });
        });
      });

      f.once('error', (err) => {
        console.log('Fetch error:', err);
        callback();  // Move to the next folder in case of error
      });

      f.once('end', () => {
        console.log(`Finished processing ${folderName}`);
      });
    });
  });
}

function EmailExtraction(req, res) {
  const imap = new Imap(imapConfig);
  const emails = [];

  imap.once('ready', () => {
    // Process INBOX first, then Junk folder (adjusting the folder name with `INBOX.` prefix)
    processEmails(imap, 'INBOX', res, emails, () => {
      processEmails(imap, 'INBOX.Junk', res, emails, () => {
        // If no emails were processed, return a message instead of crashing
        if (emails.length === 0) {
          console.log('No new emails found.');
          return res.status(200).json({ message: 'No new emails found.' });
        }

        // Insert relevant invoices into the database
        emails.forEach(email => {
          if (email.attachments && email.attachments.length > 0) {
            insertInvoice(email.attachments[0].filename, email.attachments[0].fileData, (err) => {
              if (err) {
                console.error('Error inserting invoice:', err);
                return res.status(500).json({ error: 'Error inserting invoice' });
              }
            });
          }
        });

        console.log('All folders processed, returning the response.');
        res.status(200).json(emails);  // Send the emails once all are processed
      });
    });
  });

  imap.once('error', (err) => {
    console.log(err);
    res.status(500).send('Error fetching emails');
  });

  imap.once('end', () => {
    console.log('Connection ended');
  });

  imap.connect();
}

module.exports = {
  EmailExtraction
};
