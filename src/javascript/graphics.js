// import invoke (to call rust functions from js)
const invoke = window.__TAURI__.core.invoke;

// js imports
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.5.0/auto/+esm";

// variables to hold the charts to avoid chart duplication
let categoriesPieChart = null;

// to load all graphics
export function loadAllGraphics()
{
    loadCategoriesPieChart();
}

// for the categories page

export async function loadCategoriesPieChart()
{
    const chart = document.querySelector(".categories-page-pie-chart");

    const categories = await invoke("get_categories_and_budgets");

    let categoryNames = [];
    let categoryBudgets = [];
    let categoryColors = [];

    for (const category of categories)
    {
        if (category.budget != null && category.budget > 0)
        {
            categoryNames.push(category.name);
            categoryBudgets.push(category.budget);
            categoryColors.push(category.color);
        }
    }

    // delete chart if it exists already
    if (categoriesPieChart)
    {
        categoriesPieChart.destroy();
        categoriesPieChart = null;
    }

    categoriesPieChart = new Chart(chart, {
        type: "pie",
        data:
        {
            labels: categoryNames,
            datasets:
            [
                {
                    data: categoryBudgets,
                    backgroundColor: categoryColors,

                    borderColor: "#121b14",
                    borderWidth: 2,
                    borderAlign: "inner",
                }
            ]
        },

        options:
        {
            plugins:
            {
                legend:
                {
                    display: true,

                    labels:
                    {
                        usePointStyle: true,
                        pointStyle: "circle",
                        color: "white",
                        padding: 15,
                    }
                },

                tooltip:
                {
                    callbacks:
                    {
                        label: function(context)
                        {
                            const budget = context.raw;
                            const label = context.label;

                            return " $" + (budget / 100).toFixed(2);
                        }
                    }
                }
            }
        }
    });
}