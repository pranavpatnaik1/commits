import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

export const fetchUserData = async (user, setUserData, setProfilePic) => {
    if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
                
                // Explicitly set profile picture from Firestore data
                if (data.pfp) {
                    console.log("Setting profile picture from Firestore:", data.pfp);
                    setProfilePic(data.pfp);
                } else {
                    console.log("No profile picture found, using default");
                    setProfilePic('/blue default pfp.png');
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }
};