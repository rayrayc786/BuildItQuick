const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendMissingProductEmail = async (data) => {
  const { searchTerm, userName, userPhone, userEmail } = data;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.MISSING_PRODUCT_EMAILS || 'tanuj@adventitous.solutions, devesh@adventitous.solutions, anjali@adventitous.solutions',
    subject: `Missing Product Search Alert: "${searchTerm}"`,
    text: `
      Hello Owner,

      A user just searched for a product that was not found in our database.

      Search Term: ${searchTerm}
      User Name: ${userName}
      User Phone: ${userPhone || 'N/A'}
      User Email: ${userEmail || 'N/A'}

      Please check if this product should be added to the inventory.

      Regards,
      MatAll System
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

exports.sendDailySearchReport = async (logs) => {
  const dateStr = new Date().toLocaleDateString();
  
  let tableRows = logs.map((log, index) => {
    return `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.query}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.resultsCount}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${log.user ? (log.user.fullName || log.user.phoneNumber) : 'Guest'}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${new Date(log.createdAt).toLocaleTimeString()}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <h2>Daily Search History Report - ${dateStr}</h2>
    <p>Total Searches Today: <strong>${logs.length}</strong></p>
    <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">#</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Search Term</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Results</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">User</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Time</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px;">No searches recorded today.</td></tr>'}
      </tbody>
    </table>
    <br/>
    <p>Regards,<br/>MatAll Automated Reporting</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.OWNER_EMAIL || 'techupdates@adventitous.solutions',
    subject: `Daily Search Report: ${dateStr}`,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Daily search report email sent successfully');
  } catch (error) {
    console.error('Error sending daily search report:', error);
    throw error; // Re-throw to allow cron service to handle failure
  }
};
