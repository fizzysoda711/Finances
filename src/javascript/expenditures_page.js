// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;


// imports from other js files
import 
{ 
    showLoadingScreen, 
    hideLoadingScreen, 
    getDate,
    showToast
} 
from "./helpers.js";

// ----- EXPENDITURES PAGE SPECIFIC HELPERS ----- //

// to list categories in drowdown when creating an expenditure
async function getDropdownCategories()
{
    const categories = await invoke("get_categories_and_budgets");
    const dropdownCategories = document.querySelector(".expenditure-input-categories-dropdown");

    dropdownCategories.innerHTML = `<option value="">Choose a category</option>`;
    
    categories.forEach(function (category) {
        // create a new option in the dropdown
        const option = document.createElement("option");

        // set the hidden value to reference later
        option.value = category.c_id;
        option.textContent = category.name;

        dropdownCategories.appendChild(option);
    });
}

// close and reset new expenditure creation fields
async function closeNewExpendituresPopup()
{
    const newExpenditureMenu = document.querySelector(".new-expenditure-inputs");
    const newExpenditureDropdown = document.querySelector(".expenditure-input-categories-dropdown");
    const newExpenditureAmount = document.querySelector(".new-expenditure-input-amount-input");
    const newExpenditureDate = document.querySelector(".new-expenditure-input-date-input");
    const newExpenditureNote = document.querySelector(".new-expenditure-input-note-input");

    newExpenditureMenu.classList.add("hidden");

    newExpenditureDropdown.value = "";
    newExpenditureAmount.value = "";
    newExpenditureDate.value = "";
    newExpenditureNote.value = "";

    document.querySelector(".new-expenditure-button").classList.remove("hidden");
}

// ----- EXPENDITURES PAGE SPECIFIC BEHAVIORS ----- //

// creating a new expenditure
document.querySelector(".new-expenditure-button").addEventListener("click", async function() {
    document.querySelector(".new-expenditure-inputs").classList.remove("hidden");
    document.querySelector(".new-expenditure-button").classList.add("hidden");

    await getDropdownCategories();
});

// formatting for new expenditure amount input field
// budget inputs should only allow two decimal places and no letters
const amountInput = document.querySelector(".new-expenditure-input-amount-input");
amountInput.addEventListener("input", function () {
    let digits = amountInput.value.replace(/\D/g, "");

    let cents = Number(digits);

    amountInput.value = (cents / 100).toFixed(2);
});

// closing new expenditure menu
document.querySelector(".cancel-new-expenditure-button").addEventListener("click", async function() {
    await closeNewExpendituresPopup();
});