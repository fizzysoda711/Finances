// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;

// imports from other js files
import { setupPageChangeButtons } from "./page_change.js";

import { updateDash } from "./dashboard_page.js";

import { loadCategories } from "./categories_page.js"


// is it running?
console.log("main.js is running");


// run on start of the app
window.addEventListener("DOMContentLoaded", () => {
    setupPageChangeButtons(); // setup clicker event for changing pages buttons
    loadCategories(); // load the categories
    updateDash(); // update the dashboard in home

    setInterval(updateDash, 60000); // update the dashboard every minute
});