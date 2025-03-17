export const toggleDropdown = () => {
    const dropdown = document.getElementById("dropdownMenu");
    if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
        setTimeout(() => {
            dropdown.style.visibility = "hidden";
        }, 200);
    } else {
        dropdown.style.visibility = "visible";
        requestAnimationFrame(() => {
            dropdown.classList.add("show");
        });
    }
};

export const toggleFriends = (e) => {
    e.stopPropagation();
    const friendsMenu = document.getElementById("friendsMenu");
    const overlay = document.getElementById("overlay");
    const dropdown = document.getElementById("dropdownMenu");
    
    if (friendsMenu) {
        const isVisible = friendsMenu.style.display === "block";
        friendsMenu.style.display = isVisible ? "none" : "block";
        overlay.style.display = isVisible ? "none" : "block";
        
        if (dropdown) {
            dropdown.classList.remove("show");
            dropdown.style.visibility = "hidden";
        }
    }
};

export const toggleSettings = (e) => {
    e.stopPropagation();
    const settingsMenu = document.getElementById("settingsMenu");
    const overlay = document.getElementById("overlay");
    const dropdown = document.getElementById("dropdownMenu");
    
    if (settingsMenu) {
        const isVisible = settingsMenu.style.display === "block";
        settingsMenu.style.display = isVisible ? "none" : "block";
        overlay.style.display = isVisible ? "none" : "block";
        
        if (dropdown) {
            dropdown.classList.remove("show");
            dropdown.style.visibility = "hidden";
        }
    }
};