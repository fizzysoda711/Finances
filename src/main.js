// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;

// is it running?
console.log("main.js is running");


//CHANGING PAGES
//home page
document.querySelector(".home-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".home-page").classList.remove("hidden");
});

//categories page
document.querySelector(".categories-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".categories-page").classList.remove("hidden");
});

//budgets page
document.querySelector(".savings-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".savings-page").classList.remove("hidden");
});

//expenditures page
document.querySelector(".expenditures-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".expenditures-page").classList.remove("hidden");
});

//settings page
document.querySelector(".settings-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".settings-page").classList.remove("hidden");
});

// show loading screen helper function
function showLoadingScreen(message = "Loading")
{
    document.querySelector(".loading-message").textContent = message + "...";
    document.querySelector(".loading-overlay").classList.remove("hidden");
}

// hide loading screen helper function
function hideLoadingScreen()
{
    document.querySelector(".loading-overlay").classList.add("hidden");
}


// HOME PAGE ELEMENTS
// Budget bar fill
let budget = 1500;
let spent = 500;
let left = budget - spent;
let offset;

// if left is negative the bar is 100% full
if (left < 0)
{
    offset = 0;
    document.querySelector(".budget-bar-amount").textContent = "- $" + Math.abs(left).toFixed(2);
}
else
{
    let percentUsed = spent / budget;
    offset = 100 - percentUsed * 100;
    document.querySelector(".budget-bar-amount").textContent = "$" + left.toFixed(2);
}
document.querySelector(".budget-icon-full").style.strokeDashoffset = offset;

// showing budget and amount spent on dashboard
document.querySelector(".dash-budget").textContent = "  $" + budget.toFixed(2);
document.querySelector(".dash-spent").textContent = "  $" + spent.toFixed(2);

// add colors changing slowly to red as bar fills (to do)

// function to update the date based on system date
function updateDate()
{
    let now = new Date();
    
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();

    // number month to letter month
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    let monthName = months[month];

    month = month + 1; // bc jan is 0. want it to be 1

    // change the dashboard month and year to match current
    document.querySelector(".dash-date").textContent = monthName + " " + year + " Analytics";

    return {
        Y: year,
        M: month,
        D: day
    };
}

updateDate();
setInterval(updateDate, 1000); // run update date every second (1000 ms)


// CATEGORIES PAGE
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
    document.querySelector(".make-new-category-popup").classList.add("hidden");
    document.querySelector(".make-new-category-error-message").classList.add("hidden");
    document.querySelector(".new-category-button").classList.remove("hidden");

    // clear input fields
    document.querySelector(".make-new-category-name-input").value = "";
    document.querySelector(".make-new-category-budget-input").value = "";
    document.querySelector(".make-new-category-color-input").value = "#000000";
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
    let currentDate = updateDate();

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
        // sent newCategory to add_category function in rust as category
        await invoke("add_category_and_budget", { category: newCategory});

        // close the new category input box
        document.querySelector(".make-new-category-popup").classList.add("hidden");
        document.querySelector(".make-new-category-error-message").classList.add("hidden");
        document.querySelector(".new-category-button").classList.remove("hidden");

        // clear input fields
        document.querySelector(".make-new-category-name-input").value = "";
        document.querySelector(".make-new-category-budget-input").value = "";
        document.querySelector(".make-new-category-color-input").value = "#000000";

        // hide error message if present
        document.querySelector(".make-new-category-error-message").classList.add("hidden");
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
async function loadCategories()
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
                        <button class="category-box-edit-button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <circle cx="19" cy="12" r="1"/>
                                <circle cx="5" cy="12" r="1"/>
                            </svg>
                        </button>
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

        const editButton = box.querySelector(".category-box-edit-button");
        const optionsMenu = box.querySelector(".category-options-menu");

        editButton.addEventListener("click", () => {
            optionsMenu.classList.toggle("show");
    });

    container.appendChild(box);
        
    });
}


// run on load
window.addEventListener("DOMContentLoaded", () => {
    loadCategories();
});