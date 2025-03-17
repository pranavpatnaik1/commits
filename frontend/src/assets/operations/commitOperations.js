import { doc, updateDoc, arrayUnion, increment, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const handleCommit = async (commitText, user, setRecentCommits, setCommitText) => {
    if (!commitText.trim()) return;

    try {
        const userRef = doc(db, "users", user.uid);
        const now = new Date();
        const timestamp = now.toLocaleTimeString();
        const date = now.toISOString().split('T')[0];

        // Get current user data first
        const docSnap = await getDoc(userRef);
        const userData = docSnap.exists() ? docSnap.data() : {};
        
        // Create new commit object
        const newCommit = {
            text: commitText,
            timestamp,
            date
        };

        // Update commit counts
        const currentCommitCounts = userData.commitCounts || {};
        currentCommitCounts[date] = (currentCommitCounts[date] || 0) + 1;

        // Calculate streaks and other stats
        const updatedStats = {
            commits: arrayUnion(newCommit),
            commitCounts: currentCommitCounts,
            dailyCommits: increment(1),
            weeklyCommits: increment(1),
            monthlyCommits: increment(1),
            totalCommits: increment(1),
            lastCommitDate: date
        };

        // Update Firestore with all changes
        await updateDoc(userRef, updatedStats);
        
        // Clear input
        setCommitText("");

    } catch (error) {
        console.error("Error adding commit:", error);
    }
};