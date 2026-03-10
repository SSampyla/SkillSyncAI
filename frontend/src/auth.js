// Tallentaa profiilin selaimen localStorageen
export function setProfile(profile) {
    localStorage.setItem("profile", JSON.stringify(profile));
}

// Hakee profiilin localStoragesta
export function getProfile() {
    const data = localStorage.getItem("profile");
    return data ? JSON.parse(data) : null;
}

// Logout poistaa profiilin
export function logout() {
    localStorage.removeItem("profile");
}