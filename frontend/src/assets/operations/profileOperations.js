import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "firebase/storage";
import { storage, db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";

export const handleProfilePictureUpdate = async (event, userData, user, setProfilePic, setIsUploading) => {
    const file = event.target.files[0];
    if (!file) return null;

    try {
        setIsUploading(true);
        
        // Delete existing uploaded pictures for this user
        const profilePicsRef = ref(storage, 'profile_pictures');
        const fileList = await listAll(profilePicsRef);
        const existingPics = fileList.items.filter(item => 
            item.name.startsWith(`${userData.username}_`)
        );
        await Promise.all(existingPics.map(pic => deleteObject(pic)));

        // Upload new picture
        const fileExt = file.name.split('.').pop();
        const storageRef = ref(storage, `profile_pictures/${userData.username}_${Date.now()}.${fileExt}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update Firestore with new URL
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            pfp: downloadURL
        });

        setProfilePic(downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        return null;
    } finally {
        setIsUploading(false);
    }
};

export const defaultProfilePics = {
    blue: null,
    yellow: null,
    green: null,
    orange: null,
    purple: null,
    red: null
};

// Initialize default profile pictures in Storage
export const initializeDefaultPictures = async () => {
    try {
        const defaultPicsRef = ref(storage, 'default_profile_pictures');
        const fileList = await listAll(defaultPicsRef);
        
        if (fileList.items.length === 0) {
            // Upload default pictures if they don't exist
            const colors = ['blue', 'yellow', 'green', 'orange', 'purple', 'red'];
            for (const color of colors) {
                const response = await fetch(`/${color} default pfp.png`);
                const blob = await response.blob();
                const picRef = ref(storage, `default_profile_pictures/${color}_default.jpg`);
                await uploadBytes(picRef, blob);
                defaultProfilePics[color] = await getDownloadURL(picRef);
            }
        } else {
            // Get URLs of existing default pictures
            for (const item of fileList.items) {
                const color = item.name.split('_')[0];
                defaultProfilePics[color] = await getDownloadURL(item);
            }
        }
        return defaultProfilePics;
    } catch (error) {
        console.error("Error initializing default pictures:", error);
        return null;
    }
};