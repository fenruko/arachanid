# Moderation & Security

Archanid provides a robust suite of moderation tools designed to keep your server safe. It includes manual commands, automated tasks (timed bans), and a unique **Role-Based Permission System**.

## The Permission System

Unlike most bots that rely solely on Discord's native "Administrator" permission, Archanid allows you to designate specific roles as "Moderators" for specific commands.

### Configuring Roles
To give a role permission to use Archanid's moderation commands:

1.  Use the hidden configuration command (Bot Owner Only):
    *(Note: This feature is currently managed via database manually or via the Setup Wizard's initial configuration. For manual overrides, ensure the user has `Administrator` permission in Discord).*

2.  **Standard Logic:**
    *   **Server Owner:** Has full access.
    *   **Administrator Permission:** Has full access.
    *   **Custom Roles:** Can be configured to allow specific commands (e.g., `kick` but not `ban`).

---

## Moderation Commands

### User Management

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/mod ban` | `user`, `reason`, `duration` | Bans a user. Supports timed bans (e.g., `1d`). |
| `/mod kick` | `user`, `reason` | Kicks a user from the server. |
| `/mod softban` | `user`, `reason` | Bans then immediately unbans to delete recent messages. |
| `/mod mute` | `user`, `duration`, `reason` | Assigns the "Muted" role. |
| `/mod timeout` | `user`, `duration` | Uses Discord's native Timeout feature. |
| `/mod warn` | `user`, `reason` | Logs a formal warning. |
| `/mod nick` | `user`, `nickname` | Changes or resets a user's nickname. |

### Channel Management

| Command | Arguments | Description |
| :--- | :--- | :--- |
| `/mod lock` | `channel`, `duration` | Prevents `@everyone` from sending messages. |
| `/mod unlock` | `channel` | Re-enables message sending. |
| `/mod slowmode` | `seconds` | Sets the channel rate limit. |
| `/mod clear` | `amount`, `user` | Bulk deletes messages (Purge). Can filter by user. |

---

## Automation

### Timed Actions
Archanid monitors bans, mutes, and locks every minute.
*   **Timed Ban:** automatically unbans the user after the duration expires.
*   **Timed Lock:** automatically unlocks the channel.

### UwU Lock
A unique punishment feature.
*   **Command:** `/mod uwulock user:@target`
*   **Effect:** Automatically deletes the user's messages and reposts them converted into "UwU/Furry" speak via a webhook.
*   **Unlock:** `/mod uwuunlock`

---

## Logging

To track moderation actions, ensure you have a text channel named `mod-logs`. Archanid automatically detects this channel and posts embeds for every:
*   Ban/Kick/Unban
*   Timeout/Mute
*   Warning
*   Bulk Delete
