use chrono::Utc;
use rusqlite::{params, Connection};
use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Serialize)]
struct Note {
    id: i64,
    content: String,
    embedding: String,
    created_at: String,
}

fn database_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("Nao foi possivel localizar app_data_dir: {error}"))?;

    fs::create_dir_all(&dir)
        .map_err(|error| format!("Nao foi possivel criar diretorio de dados: {error}"))?;

    Ok(dir.join("memoria_auxiliar.sqlite"))
}

fn open_database(app: &tauri::AppHandle) -> Result<Connection, String> {
    let path = database_path(app)?;
    let connection = Connection::open(path)
        .map_err(|error| format!("Nao foi possivel abrir o SQLite: {error}"))?;

    connection
        .execute_batch(
            "
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY,
                content TEXT NOT NULL,
                embedding TEXT NOT NULL,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS embedding_cache (
                hash TEXT PRIMARY KEY,
                embedding TEXT NOT NULL,
                created_at TEXT
            );
            ",
        )
        .map_err(|error| format!("Nao foi possivel inicializar o banco: {error}"))?;

    Ok(connection)
}

#[tauri::command]
fn save_note(app: tauri::AppHandle, content: String, embedding: String) -> Result<Note, String> {
    let connection = open_database(&app)?;
    let created_at = Utc::now().to_rfc3339();

    connection
        .execute(
            "INSERT INTO notes (content, embedding, created_at) VALUES (?1, ?2, ?3)",
            params![content, embedding, created_at],
        )
        .map_err(|error| format!("Nao foi possivel salvar a nota: {error}"))?;

    let id = connection.last_insert_rowid();

    Ok(Note {
        id,
        content,
        embedding,
        created_at,
    })
}

#[tauri::command]
fn list_notes(app: tauri::AppHandle) -> Result<Vec<Note>, String> {
    let connection = open_database(&app)?;
    let mut statement = connection
        .prepare("SELECT id, content, embedding, created_at FROM notes ORDER BY id DESC")
        .map_err(|error| format!("Nao foi possivel preparar consulta: {error}"))?;

    let notes = statement
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                content: row.get(1)?,
                embedding: row.get(2)?,
                created_at: row.get(3)?,
            })
        })
        .map_err(|error| format!("Nao foi possivel listar notas: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Nao foi possivel ler notas: {error}"))?;

    Ok(notes)
}

#[tauri::command]
fn get_cached_embedding(app: tauri::AppHandle, hash: String) -> Result<Option<String>, String> {
    let connection = open_database(&app)?;
    let mut statement = connection
        .prepare("SELECT embedding FROM embedding_cache WHERE hash = ?1")
        .map_err(|error| format!("Nao foi possivel preparar cache: {error}"))?;

    let mut rows = statement
        .query(params![hash])
        .map_err(|error| format!("Nao foi possivel consultar cache: {error}"))?;

    match rows
        .next()
        .map_err(|error| format!("Nao foi possivel ler cache: {error}"))?
    {
        Some(row) => row
            .get::<_, String>(0)
            .map(Some)
            .map_err(|error| format!("Cache invalido: {error}")),
        None => Ok(None),
    }
}

#[tauri::command]
fn save_cached_embedding(
    app: tauri::AppHandle,
    hash: String,
    embedding: String,
) -> Result<(), String> {
    let connection = open_database(&app)?;
    let created_at = Utc::now().to_rfc3339();

    connection
        .execute(
            "
            INSERT INTO embedding_cache (hash, embedding, created_at)
            VALUES (?1, ?2, ?3)
            ON CONFLICT(hash) DO UPDATE SET embedding = excluded.embedding
            ",
            params![hash, embedding, created_at],
        )
        .map_err(|error| format!("Nao foi possivel salvar cache: {error}"))?;

    Ok(())
}

#[tauri::command]
fn delete_note(app: tauri::AppHandle, id: i64) -> Result<(), String> {
    let connection = open_database(&app)?;
    connection
        .execute("DELETE FROM notes WHERE id = ?1", params![id])
        .map_err(|error| format!("Nao foi possivel excluir a nota: {error}"))?;
    Ok(())
}

#[tauri::command]
fn update_note(app: tauri::AppHandle, id: i64, content: String, embedding: String) -> Result<(), String> {
    let connection = open_database(&app)?;
    connection
        .execute(
            "UPDATE notes SET content = ?1, embedding = ?2 WHERE id = ?3",
            params![content, embedding, id],
        )
        .map_err(|error| format!("Nao foi possivel atualizar a nota: {error}"))?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_note,
            list_notes,
            delete_note,
            update_note,
            get_cached_embedding,
            save_cached_embedding
        ])
        .run(tauri::generate_context!())
        .expect("erro ao executar o aplicativo Tauri");
}
