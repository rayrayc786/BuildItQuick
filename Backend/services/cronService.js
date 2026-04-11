const cron = require('node-cron');
const SearchLog = require('../models/SearchLog');
const emailService = require('./emailService');

const initCronJobs = () => {
    // Run every day at 11:59 PM (23:59)
    cron.schedule('59 23 * * *', async () => {
        console.log('Running daily search history report job...');
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            // Fetch all search logs for today
            const logs = await SearchLog.find({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            })
            .populate('user', 'fullName phoneNumber email')
            .sort({ createdAt: 1 });

            if (logs.length > 0) {
                await emailService.sendDailySearchReport(logs);
                console.log(`Daily search report sent for ${logs.length} entries.`);
                
                // Clear search history after successful report
                await SearchLog.deleteMany({
                    _id: { $in: logs.map(l => l._id) }
                });
                console.log('Search history logs cleared successfully.');
            } else {
                console.log('No search logs found for today, skipping email.');
            }
        } catch (error) {
            console.error('Error in daily search report cron job:', error);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata" // Setting to India timezone as per current local time metadata
    });

    console.log('Cron jobs initialized: Daily Search Report scheduled for 11:59 PM');
};

module.exports = { initCronJobs };
