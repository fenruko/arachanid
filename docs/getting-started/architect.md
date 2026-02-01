# The Architect Wizard

The **Architect Wizard** is Archanid's signature feature. It allows you to visually design and build your server's infrastructure without typing a single manual command for each channel.

## Overview

The Wizard is an interactive "Blueprint" editor. You define what you want your server to look like, and Archanid builds it for you.

<div class="mermaid">
graph TD
    A[Start Wizard] --> B{Design Blueprint}
    B --> C[Add Categories]
    B --> D[Add Channels]
    B --> E[Define Roles]
    B --> F[Toggle Modules]
    F --> G[Build Server]
    G --> H[Finished Infrastructure]
</div>

## Using the Wizard

Run the command to open the interface:

```bash
/wizard
```

### 1. The Blueprint Menu
You will see a menu with several buttons:

*   **:material-folder-plus: Add Category:** Creates a folder (e.g., "Welcome", "Gaming", "Staff").
*   **:material-pound: Add Text:** Adds a text channel to a specific category.
*   **:material-microphone: Add Voice:** Adds a voice channel to a specific category.
*   **:material-account-plus: Add Role:** Creates a role with preset permissions (e.g., "Moderator", "Member").

### 2. Module Toggles
Enable built-in systems to have Archanid automatically create their required channels:

| Toggle | Description | Creates |
| :--- | :--- | :--- |
| **Logging** | Enables moderation logs. | `#mod-logs` (Private) |
| **Tickets** | Enables support ticket system. | `#create-ticket` (Interactive) |
| **Welcome** | Enables welcome messages. | `#welcome` |

### 3. Build Process
Once your blueprint is ready:

1.  Click the green **BUILD SERVER** button.
2.  **Confirm** the action (This cannot be undone easily).
3.  Watch as Archanid creates channels, sorts them, and assigns permissions in real-time.

!!! tip "Existing Channels"
    The Wizard **does not delete** your existing channels. It appends the new structure alongside them. You can manually archive or delete old channels afterwards.

## Advanced Architect Commands

For fine-tuning after the build:

*   `/architect nuke` - **Dangerous:** Deletes ALL channels and roles to start fresh. (Requires confirmation).
*   `/architect backup` - Save the current server layout as a template.
*   `/architect load` - Load a saved template.
