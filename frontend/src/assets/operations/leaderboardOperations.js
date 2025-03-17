import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export const fetchLeaderboardData = async (userData, leaderboardView) => {
    try {
        const usersRef = collection(db, "users");
        let usernames = [...(userData?.friends || [])];
        
        if (userData?.username) {
            usernames.push(userData.username);
        }

        if (usernames.length === 0) return [];

        const q = query(usersRef, where("username", "in", usernames));
        const querySnapshot = await getDocs(q);
        
        const today = new Date().toISOString().split('T')[0];
        
        const results = querySnapshot.docs.map(doc => {
            const userData = doc.data();
            if (leaderboardView === 'day') {
                const todayCommits = userData.commitCounts?.[today] || 0;
                return { ...userData, dailyCommits: todayCommits };
            }
            return userData;
        });

        return results.sort((a, b) => {
            switch(leaderboardView) {
                case 'day': return (b.dailyCommits || 0) - (a.dailyCommits || 0);
                case 'week': return (b.weeklyCommits || 0) - (a.weeklyCommits || 0);
                case 'month': return (b.monthlyCommits || 0) - (a.monthlyCommits || 0);
                case 'all': return (b.totalCommits || 0) - (a.totalCommits || 0);
                default: return 0;
            }
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        return [];
    }
};