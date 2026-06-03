use rusqlite::{Connection, params};
use serde::Deserialize;

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use chrono::{Datelike, Local};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() 
{
    tauri::Builder::default()
        .setup(|app|
        {
            setup_database(app.handle())
                .map_err(|error| std::io::Error::new(std::io::ErrorKind::Other, error))?;

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler!
        [
            add_category_and_budget,
            add_category_without_budget,
            get_categories_and_budgets,
            get_archived_categories_and_budgets,
            change_category_and_budget,
            count_archived_categories,
            new_month_budget_transfer,
            archive_category,
            unarchive_category,
            delete_category,
            add_expense
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


// -------------- GENERAL FUNCTIONS -------------- //


fn get_database_path(app: &tauri::AppHandle) -> Result<PathBuf, String>
{
    let app_data_dir = app.path().app_data_dir()
        .map_err(|error| error.to_string())?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|error| error.to_string())?;

    let database_path = app_data_dir.join("finances.db");

    println!("Database path: {}", database_path.display());

    Ok(database_path)
}

// get connection to database
fn get_connection(app: &tauri::AppHandle) -> Result<Connection, String>
{
    let database_path = get_database_path(app)?;

    Connection::open(database_path)
        .map_err(|error| error.to_string())
}

fn setup_database(app: &tauri::AppHandle) -> Result<(), String>
{
    let conn = get_connection(app)?;
    let schema = include_str!("schema.sql");

    match conn.execute_batch(schema)
    {
        Ok(_) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}


// -------------- STRUCTS -------------- //


// for categories and budgets page functions
#[derive(Deserialize, serde::Serialize)]
struct CategoryWithBudget {
    name: String,
    color: String,
    budget: Option<i64>,
    month: Option<i32>,
    year: Option<i32>,
    c_id: Option<i64>
}

// for expenditures page functions
#[derive(Deserialize, serde::Serialize)]
struct ExpensesStruct {
    c_id: Option<i64>,
    name: Option<String>,
    e_id: Option<i64>,
    amount: i64,
    note: Option<String>,
    year: Option<i64>,
    month: Option<i64>,
    day: Option<i64>
}


// -------------- CATEGORIES AND BUDGETS PAGE FUNCTIONS -------------- //


// adding a category with a budget to the database
#[tauri::command]
fn add_category_and_budget(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let mut conn = get_connection(&app)?;

    // start a transaction so data isn't half saved
    let tx = conn.transaction()
        .map_err(|error| error.to_string())?;

    // insert the values into CATEGORIES
    tx.execute
    (
        "INSERT INTO CATEGORIES (cat_name, cat_color) VALUES (?1, ?2)",
        params![category.name, category.color],
    )
    .map_err(|error| error.to_string())?;

    // get the category id (cat_id)
    let cat_id = tx.last_insert_rowid();

    // guards for optional fields bc rust requires it
    let budget = category.budget.ok_or("Missing budget")?;
    let month = category.month.ok_or("Missing month")?;
    let year = category.year.ok_or("Missing year")?;
    
    // insert the values into BUDGETS
    tx.execute
    (
        "INSERT INTO BUDGETS (bdgt_month, bdgt_year, cat_id, bdgt_amount) VALUES (?1, ?2, ?3, ?4)",
        params![month, year, cat_id, budget],
    )
    .map_err(|error| error.to_string())?;

    // finish the transaction
    tx.commit()
    .map_err(|error| error.to_string())?;

    Ok(())
}

// adding a category without a budget (for future use)
#[tauri::command]
fn add_category_without_budget(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let conn = get_connection(&app)?;

    // insert the values into CATEGORIES
    conn.execute
    (
        "INSERT INTO CATEGORIES (cat_name, cat_color) VALUES (?1, ?2)",
        params![category.name, category.color],
    )
    .map_err(|error| error.to_string())?;    

    Ok(())
}


// get the categories with or without budgets from the database
#[tauri::command]
fn get_categories_and_budgets(app: tauri::AppHandle) -> Result<Vec<CategoryWithBudget>, String>
{
    // get the date
    let today = Local::now();

    let month = today.month() as i32;
    let year = today.year();

    // connect to the database
    let conn = get_connection(&app)?;

    // select and join categories with budgets (allowing for categories without budgets)
    let mut statement = conn.prepare
    (
        "SELECT 
            CATEGORIES.cat_name,
            CATEGORIES.cat_color,
            BUDGETS.bdgt_amount,
            BUDGETS.bdgt_month,
            BUDGETS.bdgt_year,
            CATEGORIES.cat_id
        FROM CATEGORIES
        LEFT JOIN BUDGETS 
            ON CATEGORIES.cat_id = BUDGETS.cat_id
            AND BUDGETS.bdgt_month = ?1
            AND BUDGETS.bdgt_year = ?2
        WHERE CATEGORIES.is_archived = 0"
    )
    .map_err(|error| error.to_string())?;

    // map each row into a CategoryWithBudget struct
    let category_rows = statement.query_map(
        params![month, year],
        |row| {
            Ok(CategoryWithBudget {
                name: row.get(0)?,
                color: row.get(1)?,
                budget: row.get(2)?,
                month: row.get(3)?,
                year: row.get(4)?,
                c_id: row.get(5)?,
            })
        },
    )
    .map_err(|error| error.to_string())?;

    // create an empty list to store each struct
    let mut categories = Vec::new();

    // put the structs in the list
    for category_row in category_rows
    {
        categories.push(category_row.map_err(|error| error.to_string())?);
    }

    Ok(categories)
}

// get the categories with or without budgets from the database
#[tauri::command]
fn get_archived_categories_and_budgets(app: tauri::AppHandle) -> Result<Vec<CategoryWithBudget>, String>
{
    // get the date
    let today = Local::now();

    let month = today.month() as i32;
    let year = today.year();

    // connect to the database
    let conn = get_connection(&app)?;

    // select and join categories with budgets (allowing for categories without budgets)
    let mut statement = conn.prepare
    (
        "SELECT 
            CATEGORIES.cat_name,
            CATEGORIES.cat_color,
            BUDGETS.bdgt_amount,
            BUDGETS.bdgt_month,
            BUDGETS.bdgt_year,
            CATEGORIES.cat_id
        FROM CATEGORIES
        LEFT JOIN BUDGETS 
            ON CATEGORIES.cat_id = BUDGETS.cat_id
            AND BUDGETS.bdgt_month = ?1
            AND BUDGETS.bdgt_year = ?2
        WHERE CATEGORIES.is_archived = 1"
    )
    .map_err(|error| error.to_string())?;

    // map each row into a CategoryWithBudget struct
    let category_rows = statement.query_map(
        params![month, year],
        |row| {
            Ok(CategoryWithBudget {
                name: row.get(0)?,
                color: row.get(1)?,
                budget: row.get(2)?,
                month: row.get(3)?,
                year: row.get(4)?,
                c_id: row.get(5)?,
            })
        },
    )
    .map_err(|error| error.to_string())?;

    // create an empty list to store each struct
    let mut categories = Vec::new();

    // put the structs in the list
    for category_row in category_rows
    {
        categories.push(category_row.map_err(|error| error.to_string())?);
    }

    Ok(categories)
}

// get the number of archived categories
#[tauri::command]
fn count_archived_categories(app: tauri::AppHandle) -> Result<i64, String>
{
    // get database connection
    let conn = get_connection(&app)?;

    // count the number of archived categories
    let count = conn.query_row(
        "SELECT COUNT(*)
         FROM CATEGORIES
         WHERE is_archived = 1",
        [],
        |row| row.get(0),
    )
    .map_err(|error| error.to_string())?;

    // return the number of archived categories
    Ok(count)
}

// edit category with budget
#[tauri::command]
fn change_category_and_budget(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let mut conn = get_connection(&app)?;

    // start a transaction so data isn't half saved
    let tx = conn.transaction()
        .map_err(|error| error.to_string())?;

    // guards for optional fields bc rust requires it
    let budget = category.budget.ok_or("Missing budget")?;
    let month = category.month.ok_or("Missing month")?;
    let year = category.year.ok_or("Missing year")?;
    let catid = category.c_id.ok_or("Missing category id")?;

    // change the values in CATEGORIES
    tx.execute
    (
        "UPDATE CATEGORIES
         SET cat_name = ?1,
             cat_color = ?2
         WHERE cat_id = ?3",
        params![category.name, category.color, catid],
    )
    .map_err(|error| error.to_string())?;

    // change the values in BUDGETS
    tx.execute
    (
        "INSERT INTO BUDGETS (bdgt_month, bdgt_year, cat_id, bdgt_amount)
        VALUES (?1, ?2, ?3, ?4)
        ON CONFLICT(bdgt_month, bdgt_year, cat_id)
        DO UPDATE SET bdgt_amount = excluded.bdgt_amount",
        params![month, year, catid, budget],
    )
    .map_err(|error| error.to_string())?;

    // finish the transaction
    tx.commit()
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn new_month_budget_transfer(app: tauri::AppHandle) -> Result<(), String>
{
    // get the current date
    let today = Local::now();
    let cur_month = today.month() as i32;
    let cur_year = today.year();

    // get the previous month
    let mut prev_month = cur_month - 1;
    let mut prev_year = cur_year;

    if prev_month == 0
    {
        prev_month = 12;
        prev_year -= 1;
    }

    // get connection to the database
    let conn = get_connection(&app)?;

    conn.execute
    (
        "INSERT OR IGNORE INTO BUDGETS (bdgt_month, bdgt_year, cat_id, bdgt_amount)
        SELECT
            ?1,
            ?2,
            BUDGETS.cat_id,
            BUDGETS.bdgt_amount
        FROM BUDGETS
        JOIN CATEGORIES
            ON CATEGORIES.cat_id = BUDGETS.cat_id
        WHERE BUDGETS.bdgt_month = ?3
        AND BUDGETS.bdgt_year = ?4
        AND CATEGORIES.is_archived = 0",
        params![cur_month, cur_year, prev_month, prev_year]
    )
    .map_err(|error| error.to_string())?;

    Ok(())
}


#[tauri::command]
fn archive_category(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let mut conn = get_connection(&app)?;

    // start a transaction so data isn't half saved
    let tx = conn.transaction()
        .map_err(|error| error.to_string())?;

    // get the cat_id
    let catid = category.c_id.ok_or("Missing category id")?;

    // set is_archives to 1 (true) in CATEGORIES
    tx.execute
    (
        "UPDATE CATEGORIES
        SET is_archived = 1
        WHERE cat_id = ?1",
        params![catid]
    )
    .map_err(|error| error.to_string())?;

    // get the date to delete the budget for the current month
    let today = Local::now();
    let month = today.month() as i32;
    let year = today.year();

    tx.execute
    (
        "DELETE FROM BUDGETS
        WHERE cat_id = ?1
        AND bdgt_month = ?2
        AND bdgt_year = ?3",
        params![catid, month, year]
    )
    .map_err(|error| error.to_string())?;

    // finish the transaction
    tx.commit()
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[tauri::command]
fn unarchive_category(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let conn = get_connection(&app)?;

    // get the cat_id
    let catid = category.c_id.ok_or("Missing category id")?;

    // insert the values into CATEGORIES
    conn.execute
    (
        "UPDATE CATEGORIES
        SET is_archived = 0
        WHERE cat_id = ?1",
        params![catid]
    )
    .map_err(|error| error.to_string())?;    

    Ok(())
}


#[tauri::command]
fn delete_category(app: tauri::AppHandle, category: CategoryWithBudget) -> Result<(), String>
{
    // connect to the database
    let mut conn = get_connection(&app)?;

    // start a transaction so data isn't half saved
    let tx = conn.transaction()
        .map_err(|error| error.to_string())?;

    // get the cat_id
    let catid = category.c_id.ok_or("Missing category id")?;

    // check if the category has any attached expenditures
    let expenditure_count: i64 = tx.query_row
    (
        "SELECT COUNT(*)
        FROM EXPENDITURES
        WHERE cat_id = ?1",
        params![catid],
        |row| row.get(0),
    )
    .map_err(|error| error.to_string())?;    

    // if it has expenditures, return an error
    if expenditure_count > 0 
    {
        return Err("This category has expenditures and cannot be deleted.".to_string());
    }

    // otherwise delete budgets attached to it and then the category
    tx.execute(
        "DELETE FROM BUDGETS
         WHERE cat_id = ?1",
        params![catid],
    )
    .map_err(|error| error.to_string())?;

    tx.execute(
        "DELETE FROM CATEGORIES
         WHERE cat_id = ?1",
        params![catid],
    )
    .map_err(|error| error.to_string())?;

    // end the transaction
    tx.commit()
        .map_err(|error| error.to_string())?;

    Ok(())

}


// -------------- EXPENDITURES PAGE FUNCTIONS -------------- // 

// to add an expense entry to the database
#[tauri::command]
fn add_expense(app: tauri::AppHandle, expense: ExpensesStruct) -> Result<(), String> 
{ 
    // get connection to database 
    let conn = get_connection(&app)?; 
    
    // different inserts depending on if a note was added or not
    if expense.note.is_none()
    { 
        conn.execute 
        ( 
            "INSERT INTO EXPENDITURES
            (exp_day, exp_month, exp_year, exp_amount, cat_id)
            VALUES (?1, ?2, ?3, ?4, ?5)", 
            params![expense.day, expense.month, expense.year, expense.amount, expense.c_id]
        ) 
        .map_err(|error| error.to_string())?; 
    } 
    else 
    { 
        conn.execute 
        ( 
            "INSERT INTO EXPENDITURES
            (exp_day, exp_month, exp_year, exp_amount, cat_id, exp_note) 
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)", 
            params![expense.day, expense.month, expense.year, expense.amount, expense.c_id, expense.note] 
        ) 
        .map_err(|error| error.to_string())?; 
    } 
    
    Ok(()) 
}
