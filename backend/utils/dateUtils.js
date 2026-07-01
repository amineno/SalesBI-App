const getDateRange = (range) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;
        case '7d':
            start.setDate(now.getDate() - 7);
            break;
        case '30d':
            start.setDate(now.getDate() - 30);
            break;
        case 'this_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;
        case 'this_year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
            start = new Date(2000, 0, 1);
            break;
        default:
            start.setDate(now.getDate() - 30); // Default to 30 days
    }

    return { start, end };
};

module.exports = { getDateRange };
