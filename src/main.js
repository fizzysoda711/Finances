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
document.querySelector(".budgets-button").addEventListener("click", function () 
{
    document.querySelectorAll(".page").forEach(function (page) 
    {
        page.classList.add("hidden");
    });
    document.querySelector(".budgets-page").classList.remove("hidden");
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

// add colors changing slowly to red as bar fills

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

// pressing the save button after making a new category
document.querySelector(".save-new-category-button").addEventListener("click", function () 
{
    document.querySelector(".make-new-category-popup").classList.add("hidden");
    document.querySelector(".new-category-button").classList.remove("hidden");

    // save the values from input fields to database
    let catName = document.querySelector(".make-new-category-name-input").value;
    let catBudget = document.querySelector(".make-new-category-budget-input").value;
    // deal with color later

    fetch("/categories",
        {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify
            ({
                name: name,
                budget: budget,
            })
        }
    )

    // clear input fields
    document.querySelector(".make-new-category-name-input").value = "";
    document.querySelector(".make-new-category-budget-input").value = "";
    document.querySelector(".make-new-category-color-input").value = "#000000";
});

// pressing the cancel button on the making a new category popup
document.querySelector(".cancel-new-category-button").addEventListener("click", function () 
{
    document.querySelector(".make-new-category-popup").classList.add("hidden");
    document.querySelector(".new-category-button").classList.remove("hidden");

    // clear input fields
    document.querySelector(".make-new-category-name-input").value = "";
    document.querySelector(".make-new-category-budget-input").value = "";
    document.querySelector(".make-new-category-color-input").value = "#000000";
});

// budget inputs should only allow two decimal places and no letters
const budgetInput = document.querySelector(".make-new-category-budget-input");
budgetInput.addEventListener("input", function () {
    let digits = budgetInput.value.replace(/\D/g, "");

    let cents = Number(digits);

    budgetInput.value = (cents / 100).toFixed(2);
});
