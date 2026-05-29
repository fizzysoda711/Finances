use rusqlite::{Connection, params};
use serde::Deserialize;

use std::fs;
use std::path::PathBuf;
use tauri::Manager;

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
            get_categories_and_budgets

        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

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

// category and budget struct (optional budget for future implementation)
#[derive(Deserialize, serde::Serialize)]
struct CategoryWithBudget {
    name: String,
    color: String,
    budget: Option<i64>,
    month: Option<i32>,
    year: Option<i32>,
}


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
            BUDGETS.bdgt_year
        FROM CATEGORIES
        LEFT JOIN BUDGETS ON CATEGORIES.cat_id = BUDGETS.cat_id"
    )
    .map_err(|error| error.to_string())?;

    // map each row into a CategoryWithBudget struct
    let category_rows = statement.query_map([], |row| 
    {
        Ok(CategoryWithBudget {
            name: row.get(0)?,
            color: row.get(1)?,
            budget: row.get(2)?,
            month: row.get(3)?,
            year: row.get(4)?,
        })
    })
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



