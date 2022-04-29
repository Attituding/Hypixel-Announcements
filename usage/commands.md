---
description: This page documents the available commands.
order: 2
---

# Commands

## Information

Click on a command to learn more about it.

+++ **/announcements**
Configure what announcements you want to receive

||| Cooldown
5 seconds
||| Server Channel Only
Yes
|||
+++ **/help**
Displays helpful information and available commands

||| Cooldown
5 seconds
||| Server Channel Only
No
|||
+++

## Structures

The layouts of each command in the YAML format.

==- /announcements

```yaml
name: announcements
description: Configure what announcements you want to receive
options:
    - name: general
      description: General Hypixel News and Announcements
      type: 1
      options:
          - name: channel
            type: 7
            channel_types: [ChannelTypes.GUILD_TEXT]
            description: The channel where Hypixel News and Announcements should be toggled
            required: true
    - name: skyblock
      description: SkyBlock Patch Notes
      type: 1
      options:
          - name: channel
            type: 7
            channel_types: [ChannelTypes.GUILD_TEXT]
            description: The channel where SkyBlock Patch Notes should be toggled
            required: true
    - name: moderation
      description: Moderation Information and Changes
      type: 1
      options:
          - name: channel
            type: 7
            channel_types: [ChannelTypes.GUILD_TEXT]
            description: The channel where Moderation Information and Changes should be toggled
            required: true
```

==- /help

```yaml
name: help
description: Displays helpful information and available commands
options:
    - name: commands
      type: SUB_COMMAND
      description: Displays information about commands
      options:
          - name: command
            type: STRING
            description: A command to get info about. This parameter is completely optional
            required: false
            choices:
                - name: '/announcements'
                  value: announcements
                - name: '/help'
                  value: help
    - name: information
      description: Returns information about this bot
      type: SUB_COMMAND
```

===
