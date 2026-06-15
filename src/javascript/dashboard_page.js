// imports
import { getDate } from "./helpers.js";

// update dashboard (called every minute in main.js)
export function updateDash()
{
    let date = getDate();

    // change the dashboard month and year to match current
    document.querySelector(".dash-date").textContent = date.MN + " " + date.Y + " Analytics";
}

// Budget bar variables
let budget = 1587;
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