# Server Architect Module

The **Server Architect** module is the core engine behind Archanid's ability to manage server structure. While the [Wizard](../getting-started/architect.md) is the visual front-end, this module handles the backend logic for templates, backups, and mass-actions.

## Command Reference

### `/wizard`
Launches the interactive GUI for building a server.
*   **Permissions:** Administrator
*   **Cooldown:** 1 minute

### `/architect backup`
Creates a JSON snapshot of the current server structure.
*   **Saves:** Categories, Channels, Roles, Permission Overwrites.
*   **Does not save:** Messages, Member data, Bans.
*   **Usage:** `/architect backup name:MyBackup`

### `/architect load`
Restores a server structure from a saved backup.
*   **Usage:** `/architect load id:BackupID`
*   **Warning:** This will attempt to recreate the structure. It does not delete existing channels unless specified.

### `/architect nuke`
**DESTRUCTIVE ACTION.**
Deletes **ALL** channels and roles in the server (except the bot's own role and the integrated `@everyone`).
*   **Usage:** `/architect nuke confirm:True`
*   **Safety:** Requires the user to be the **Server Owner**. Administrators cannot use this.

### `/architect sync`
Force-syncs channel permissions with their category.
*   **Usage:** `/architect sync category:CategoryName`

## Templating System
Archanid uses a proprietary JSON schema for server templates.

```json
{
  "name": "Gaming Community",
  "categories": [
    {
      "name": "General",
      "channels": ["chat", "media", "memes"]
    },
    {
      "name": "Voice",
      "channels": ["Lounge", "Gaming 1"]
    }
  ],
  "roles": ["Admin", "Mod", "VIP", "Member"]
}
```
*(This is a simplified view of the internal structure)*
