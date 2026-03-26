// Tässä demo-tilaa käsittelevässä hookissa käytetään `localStoragea` tilan säilyttämiseen, mikä mahdollistaa tilan säilymisen sivun uudelleenlatausten välillä. Tämä on hyödyllistä, koska demo-tilassa halutaan usein testata sovelluksen toiminnallisuuksia ilman, että käyttäjätiedot vaikuttavat oikeaan dataan.

export function isDemoMode() {
    return localStorage.getItem("demoMode") === "true";
}

export function enableDemoMode() {
    localStorage.setItem("demoMode", "true");
    window.location.reload();
}

export function disableDemoMode() {
    localStorage.removeItem("demoMode");
    window.location.reload();
}