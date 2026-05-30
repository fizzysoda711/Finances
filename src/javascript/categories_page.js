// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;

// imports from other js files
import 
{ 
    showLoadingScreen, 
    hideLoadingScreen, 
    getDate
} 
from "./helpers.js";

// CATEGORIES PAGE-SPECIFIC HELPERS

// clear and close new category creating input fields
function closeNewCategoryPopup() {
    document.querySelector(".make-new-category-popup").classList.add("hidden");
    document.querySelector(".make-new-category-error-message").classList.add("hidden");
    document.querySelector(".new-category-button").classList.remove("hidden");

    document.querySelector(".make-new-category-name-input").value = "";
    document.querySelector(".make-new-category-budget-input").value = "";
    document.querySelector(".make-new-category-color-input").value = "#000000";

    document.querySelector(".make-new-category-error-message").classList.add("hidden");
}





// pressing add category button
document.querySelector(".new-category-button").addEventListener("click", function () 
{
    document.querySelector(".make-new-category-popup").classList.remove("hidden");
    document.querySelector(".new-category-button").classList.add("hidden");
});

// budget inputs should only allow two decimal places and no letters
const budgetInput = document.querySelector(".make-new-category-budget-input");
budgetInput.addEventListener("input", function () {
    let digits = budgetInput.value.replace(/\D/g, "");

    let cents = Number(digits);

    budgetInput.value = (cents / 100).toFixed(2);
});


// pressing the cancel button on the making a new category popup
document.querySelector(".cancel-new-category-button").addEventListener("click", function () 
{
    closeNewCategoryPopup();
});


// pressing the save button after making a new category
document.querySelector(".save-new-category-button").addEventListener("click", async function () 
{
    // save the values from input fields
    let catName = document.querySelector(".make-new-category-name-input").value;
    let catColor = document.querySelector(".make-new-category-color-input").value;
    let catBudget = document.querySelector(".make-new-category-budget-input").value;
    
    // check that all three fields are filled out
    if (catName === "" || catColor === "" || catBudget === "") 
    {
        document.querySelector(".make-new-category-error-message").textContent = "Please fill out all fields.";
        document.querySelector(".make-new-category-error-message").classList.remove("hidden");
        return;
    }

    // get the date
    let currentDate = getDate();

    // make budget into a number (and remove decimals)
    catBudget = Math.round(Number(catBudget) * 100);

    // create javascript object
    let newCategory =
    {
        name: catName,
        color: catColor,
        budget: catBudget,
        month: currentDate.M,
        year: currentDate.Y
    }
    console.log(newCategory);

    // show the loading screen
    showLoadingScreen("Saving category");

    try
    {
        // send newCategory to add_category function in rust as category
        await invoke("add_category_and_budget", { category: newCategory});

        // clear and close new category popup box
        closeNewCategoryPopup();
    }
    catch (error)
    {
        document.querySelector(".make-new-category-error-message").textContent = "Save failed: " + error;
        document.querySelector(".make-new-category-error-message").classList.remove("hidden");        
    }
    finally
    {
        hideLoadingScreen();
        loadCategories();
    }

});

// load categories
export async function loadCategories()
{
    const categories = await invoke("get_categories_and_budgets");

    const container = document.querySelector(".categories-list");
    container.innerHTML = "";

    categories.forEach(category => {
        const box = document.createElement("div");

        box.classList.add("category-box");

        box.innerHTML = 
        `
            <div class="category-box-color" style="background-color: ${category.color};"></div>
            <div class="category-box-content">
                <div class="category-box-name-and-edit">
                    <p class="category-box-name">${category.name}</p>
                    <div>
                        <button class="category-box-options-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                            </svg>
                        </button>

                        <div class="category-box-options-menu column hidden">
                            <button class="category-box-options-menu-button category-box-edit-button">Edit</button>
                            <div class="category-box-options-menu-line horizontal-center"></div>
                            <button class="category-box-options-menu-button category-box-archive-button">Archive</button>
                            <div class="category-box-options-menu-line horizontal-center"></div>
                            <button class="category-box-options-menu-button category-box-delete-button">Delete</button>
                        </div>
                    </div>
                </div>
                <div class="category-box-budget">
                    <p class="category-box-budget-label">Budget: </p>
                    <p class="category-box-budget-number">
                        ${category.budget === null ? "No budget set" : `$${(category.budget / 100).toFixed(2)}`}
                    </p>
                </div>
            </div>
            
        `
        ;

        const editButton = box.querySelector(".category-box-options-button");
        const optionsMenu = box.querySelector(".category-box-options-menu");

        // opens the options menu for the category
        editButton.addEventListener("click", () => {
            event.stopPropagation();

            document.querySelectorAll(".category-box-options-menu").forEach(function (menu) {
                menu.classList.add("hidden");
            });
            
            optionsMenu.classList.remove("hidden");

        // closes the options menu for the category when anything is clicked on the screen
        document.addEventListener("click", function () {
            optionsMenu.classList.add("hidden");
            editButton.classList.remove("hidden");
        });
    });

    container.appendChild(box);
        
    });
}