export const updateDateTime = (setCurrentDate, setCurrentTime) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
    });
    
    setCurrentDate(formattedDate);
    setCurrentTime(formattedTime);
};

export const getCommitColorForDate = (commitCount) => {
    const redHue = Math.max(20, 217 - commitCount * 30);
    const greenHue = Math.max(120, 217 - commitCount * 15);
    return `rgb(${redHue}, ${greenHue}, 225)`;
};