const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('players')
        .setDescription('Get the current number of players on the FiveM server, along with player names, IDs, and pings'),
    async execute(interaction) {
        try {
            const response = await axios.get('https://servers-frontend.fivem.net/api/servers/single/o7vyjr', {
                headers: {
                    'User-Agent': 'YourBotName/1.0', // Custom User-Agent header
                    // Add any other headers required by the API
                }
            });

            const playerCount = response.data.Data.clients; // Current number of players
            const maxPlayers = response.data.Data.sv_maxclients; // Maximum number of players allowed
            const players = response.data.Data.players; // Player details (names, IDs, and ping)

            // Build a string for player names, IDs, and pings
            let playerDetails = '';
            if (players && players.length > 0) {
                playerDetails = players.map(player => `**${player.name}** | (ID: ${player.id})`).join('\n');
            } else {
                playerDetails = 'No players currently online.';
            }

            const embed = new EmbedBuilder()
                .setColor('#FFC0CB')
                .setTitle("Kalidad City RP Player Count")
                .setThumbnail('https://i.imgur.com/wiDQQNA.png')
                .setDescription(`There are currently **${playerCount}** players online out of a maximum **${maxPlayers}**.\n\n**Players:**\n${playerDetails}`)
                .setTimestamp()
                .setImage('https://i.imgur.com/IQQzrg8.gifv');

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching player count or player details:', error);
            await interaction.reply({ content: 'Error fetching player count or player details. Please try again later.', ephemeral: true });
        }
    }
};