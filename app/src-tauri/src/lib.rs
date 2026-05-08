use tauri_plugin_sql::{Migration, MigrationKind};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! MeMeMe is ready.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create local schema",
            sql: "
                CREATE TABLE IF NOT EXISTS local_blocks (
                    id TEXT PRIMARY KEY,
                    block_type TEXT NOT NULL,
                    encrypted_content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    tags TEXT NOT NULL DEFAULT '[]',
                    status TEXT NOT NULL DEFAULT 'active',
                    device_id TEXT NOT NULL,
                    synced_at INTEGER,
                    is_dirty INTEGER NOT NULL DEFAULT 1
                );
                CREATE TABLE IF NOT EXISTS local_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS sync_meta (
                    last_sync_at INTEGER,
                    server_url TEXT
                );
            ",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:mememe.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running MeMeMe");
}
