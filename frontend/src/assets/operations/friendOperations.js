import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "../../firebase";

export const handleFriendRequest = async (e, friendUsername, user, userData, setFriendUsername, setUserData) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    const cleanUsername = friendUsername.replace('@', '');
    
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", cleanUsername));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("User not found");
            return;
        }

        const targetUserDoc = querySnapshot.docs[0];
        const batch = writeBatch(db);

        // Update both users
        const currentUserRef = doc(db, "users", user.uid);
        batch.update(currentUserRef, {
            "requests.pending_requests": arrayUnion(cleanUsername)
        });

        batch.update(targetUserDoc.ref, {
            "requests.incoming_requests": arrayUnion(userData.username)
        });

        await batch.commit();
        setFriendUsername('');

        // Update UI
        const updatedDocSnap = await getDoc(currentUserRef);
        if (updatedDocSnap.exists()) {
            setUserData(updatedDocSnap.data());
        }
    } catch (error) {
        console.error("Error sending friend request:", error);
    }
};