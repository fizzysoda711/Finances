// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;

// imported functions from other js files
import { setupPageChangeButtons } from "./page_change.js";

import 
{ 
    showLoadingScreen, 
    hideLoadingScreen, 
    getDate
} 
from "./helpers.js";

import { updateDash } from "./dashboard_page.js";


// is it running?
console.log("main.js is running");


// update the dashboard every minte (60,000 ms)
updateDash();
setInterval(updateDash, 60000);



// run on start of the app
window.addEventListener("DOMContentLoaded", () => {
    setupPageChangeButtons(); // setup clicker event for changing pages buttons
    loadCategories(); // load the categories
    updateDash(); // update the dashboard in home
});