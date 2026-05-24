// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use rusqlite::Connection;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



// get connection to database
fn get_connection() -> Result<Connection, String>
{
    match Connection::open("finances.db")
    {
        Ok(conn) => {return Ok(conn);}
        Err(error) => {return Err(error.to_string());}
    }
}

// create the database if it doesn't exist
#[tauri::command]
fn setup_database() -> Result<(), String>
{
    let conn = get_connection()?;
    let schema = include_str!("schema.sql");

    match conn.execute_batch(schema)
    {
        Ok(_) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

// adding a category with or without a budget
// TO DO (check if budget saves as int or decimal)


