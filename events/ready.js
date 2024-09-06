const { ActivityType } = require('discord.js');
const axios = require('axios');
var config = require('../config.json');

const serverURL = 'https://servers-frontend.fivem.net/api/servers/single/o7vyjr'; // Replace with your server URL

module.exports = {
    name: 'ready', 
    once: true,
    async execute(client) { 
        let toggle = true; // Used to switch between activities

        const updateActivity = async () => {
            try {
                // Fetch player count
                const response = await axios.get(serverURL, {
                    headers: {
                        'User-Agent': 'YourBotName/1.0' // Set a User-Agent header
                    }
                });
                const playerCount = response.data.Data.clients;
                const maxPlayers = response.data.Data.sv_maxclients;

                if (toggle) {
                    // Update bot activity to "Watching the server"
                    await client.user.setActivity({
                        name: `${playerCount}/${maxPlayers} players`,
                        type: ActivityType.Watching,
                    });

                    //console.log(`Activity set to watching ${playerCount}/${maxPlayers} players`);
                } else {
                    // Update bot activity to "Ohaha"
                    await client.user.setActivity({
                        name: 'Ohaha',
                        type: ActivityType.Watching,
                    });

                    //console.log('Activity set to Ohaha');
                }

                toggle = !toggle; // Toggle between true and false
            } catch (error) {
                console.error('Error fetching player count:', error);
            }
        };

        updateActivity(); // Initial call to set activity

        // Update activity every 10 seconds
        setInterval(updateActivity, 10000); // 10 seconds interval
    },
};
