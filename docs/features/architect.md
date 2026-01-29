# Server Architect

The **Server Architect** is Archanid's flagship feature. It transforms the tedious process of manually creating channels, categories, and roles into a streamlined, visual "Blueprint" system.

## The Blueprint System

When you run `/wizard`, you are creating a **Blueprint**. This blueprint exists only in the bot's memory until you click **BUILD SERVER**. This allows you to experiment with different layouts without spamming your server with half-created channels.

### Components

#### 📂 Categories
Categories act as folders for your channels. You cannot create a channel without assigning it to a category first.
*   **Best Practice:** Create categories for "Information", "General Chat", "Voice Lounges", and "Staff Area".

#### 📝 Text Channels
Standard text channels for chatting.
*   **Wizard Input:** Enter the channel name (e.g., `general`) and the *exact name* of the Parent Category you created in the previous step.

#### 🔊 Voice Channels
Voice channels for audio communication.
*   **Wizard Input:** Same as text channels; requires a valid Parent Category.

#### 🛡️ Roles
Roles define the hierarchy of your server.
*   **Hoist:** The Wizard automatically sets roles to be "hoisted" (displayed separately in the member list).
*   **Color:** The Wizard assigns a random color to each new role to make them distinct.

---

## Automated Feature Setup

The "Toggle Features" menu in the Wizard allows you to auto-generate the necessary infrastructure for Archanid's other modules.

### Available Presets

| Feature | Channels Created | Purpose |
| :--- | :--- | :--- |
| **Community** | `Community Info/rules`<br>`Community Info/announcements` | Standard channels for server rules and news. |
| **Logs** | `Logs/mod-logs` | A private channel for Archanid's moderation audit logs. |
| **Leveling** | (Internal Config) | Prepares the database for tracking XP (no channels created). |
| **Tickets** | (Internal Config) | Prepares the ticket system (requires `/tickets setup` later). |

---

## Example Blueprint

Here is an example of a common server layout you can build in 60 seconds with the Wizard:

**📂 Information**
> `#️⃣ rules`
> `#️⃣ announcements`
> `#️⃣ welcome`

**📂 General**
> `#️⃣ chat`
> `#️⃣ media`
> `#️⃣ bot-commands`

**📂 Voice**
> `🔊 Lounge`
> `🔊 Music`
> `🔊 AFK`

**🛡️ Roles**
> `Owner`
> `Admin`
> `Member`
> `Bot`
