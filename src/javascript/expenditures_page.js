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
export async function getDropdownCategories()
{
    const categories = await invoke("get_categories_and_budgets");
    const dropdownCategories = document.querySelector(".expense-input-categories-dropdown");

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
async function closeNewExpensePopup()
{
    const newExpenseMenu = document.querySelector(".new-expense-inputs");
    const newExpenseDropdown = document.querySelector(".expense-input-categories-dropdown");
    const newExpenseAmount = document.querySelector(".new-expense-input-amount-input");
    const newExpenseDate = document.querySelector(".new-expense-input-date-input");
    const newExpenseNote = document.querySelector(".new-expense-input-note-input");

    newExpenseMenu.classList.add("hidden");

    newExpenseDropdown.value = "";
    newExpenseAmount.value = "";
    newExpenseDate.value = "";
    newExpenseNote.value = "";

    document.querySelector(".new-expense-button").classList.remove("hidden");
}

// add function to load expenses
async function loadExpenses()
{
    // make the sql string
    sqlMessage = "";


}

    // how the expenses are loaded will depend on user selections
    // make an object that can hold various selection parameters to send to rust



// ----- EXPENDITURES PAGE SPECIFIC BEHAVIORS ----- //

// new expense button and input menu
document.querySelector(".new-expense-button").addEventListener("click", async function() {
    document.querySelector(".new-expense-inputs").classList.remove("hidden");
    document.querySelector(".new-expense-button").classList.add("hidden");

    await getDropdownCategories();
});

// formatting for new expense amount input field
const amountInput = document.querySelector(".new-expense-input-amount-input");
amountInput.addEventListener("input", function () {
    let digits = amountInput.value.replace(/\D/g, "");

    let cents = Number(digits);

    amountInput.value = (cents / 100).toFixed(2);
});

// cancel making new expense
document.querySelector(".cancel-new-expense-button").addEventListener("click", async function() {
    await closeNewExpensePopup();

    document.querySelector(".new-expense-error-message").classList.add("hidden");
});

// saving new expense
document.querySelector(".save-new-expense-button").addEventListener("click", async function() {
    const catid = document.querySelector(".expense-input-categories-dropdown").value;
    let amountInput = document.querySelector(".new-expense-input-amount-input").value;
    let dateInput = document.querySelector(".new-expense-input-date-input").value;
    let noteInput = document.querySelector(".new-expense-input-note-input").value;
   
    // verify date, amount, and category have inputs
    if (catid == "" || amountInput == "")
    {
        const errorMessage = document.querySelector(".new-expense-error-message");

        errorMessage.textContent = "Please fill out category and amount.";
        errorMessage.classList.remove("hidden");
        return;
    }

    // make varaibles for year, month, and day
    let yearInput;
    let monthInput;
    let dayInput;

    if (dateInput == "")
    {
        let date = getDate();
        yearInput = date.Y;
        monthInput = date.M;
        dayInput = date.D;
    }
    else
    {
        let date = dateInput.split("-");
        let yearInput = Number(date[0]);
        let monthInput = Number(date[1]);
        let dayInput = Number(date[2]);
    }

    // to send to rust function
    let newExpense =
    {
        c_id: Number(catid),
        amount: Math.round(Number(amountInput) * 100), // database uses cents
        year: yearInput,
        month: monthInput,
        day: dayInput,
        note: noteInput.trim() == "" ? null : noteInput.trim()
    }

    try
    {
        await invoke("add_expense", { expense: newExpense });
        document.querySelector(".new-expense-error-message").classList.add("hidden"); 
    }
    catch (error)
    {
        document.querySelector(".new-expense-error-message").textContent = "Save failed: " + error;
        document.querySelector(".new-expense-error-message").classList.remove("hidden"); 
    }
    finally
    {
        await closeNewExpensePopup();
    }
    // finish finally block and use load expenses function
});

// opening and closing the expenses sorting menu
document.querySelector(".sort-expenses-button").addEventListener("click", async function()
{
    document.querySelector(".expenses-sorting-section").classList.toggle("hidden");
});

// opening and closing the sorting menu sections
document.querySelector(".date-exepenses-sorting").addEventListener("click", async function()
{
    document.querySelector(".date-expenses-sorting-icon-closed").classList.toggle("hidden");
    document.querySelector(".date-expenses-sorting-icon-open").classList.toggle("hidden");

    document.querySelector(".expenses-sorting-date-selection-menu").classList.toggle("hidden");
});
document.querySelector(".category-exepenses-sorting").addEventListener("click", async function()
{
    document.querySelector(".category-expenses-sorting-icon-closed").classList.toggle("hidden");
    document.querySelector(".category-expenses-sorting-icon-open").classList.toggle("hidden");

    document.querySelector(".expenses-sorting-category-selection-menu").classList.toggle("hidden");
});
document.querySelector(".amount-exepenses-sorting").addEventListener("click", async function()
{
    document.querySelector(".amount-expenses-sorting-icon-closed").classList.toggle("hidden");
    document.querySelector(".amount-expenses-sorting-icon-open").classList.toggle("hidden");

    document.querySelector(".expenses-sorting-amount-selection-menu").classList.toggle("hidden");
});
document.querySelector(".note-exepenses-sorting").addEventListener("click", async function()
{
    document.querySelector(".note-expenses-sorting-icon-closed").classList.toggle("hidden");
    document.querySelector(".note-expenses-sorting-icon-open").classList.toggle("hidden");

    document.querySelector(".expenses-sorting-note-selection-menu").classList.toggle("hidden");
});