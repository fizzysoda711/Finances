// show loading screen helper function
export function showLoadingScreen(message = "Loading")
{
    document.querySelector(".loading-message").textContent = message + "...";
    document.querySelector(".loading-overlay").classList.remove("hidden");
}

// hide loading screen helper function
export function hideLoadingScreen()
{
    document.querySelector(".loading-overlay").classList.add("hidden");
}

// function to update the date based on system date
export function getDate()
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

    return {
        Y: year,
        M: month,
        MN: monthName,
        D: day
    };
}

// function to display toast message with custom message
export function showToast(message) {
    const toast = document.querySelector(".toast-message");

    toast.textContent = message;
    toast.classList.remove("hidden");

    setTimeout(function () {
        toast.classList.add("hidden");
    }, 2500);
}