const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('find')
        .setDescription('Find a player by their name on the FiveM server')
        .addStringOption(option =>
            option.setName('playername')
                .setDescription('Enter the player\'s name')
                .setRequired(true)),
    async execute(interaction) {
        const playerName = interaction.options.getString('playername').toLowerCase();
        try {
            const response = await axios.get('https://servers-frontend.fivem.net/api/servers/single/o7vyjr', {
                headers: {
                    'User-Agent': 'YourBotName/1.0',
                }
            });

            const players = response.data.Data.players;

            if (Array.isArray(players)) {
                const matchingPlayers = players.filter(player => 
                    player.name.toLowerCase().includes(playerName)
                );

                if (matchingPlayers.length > 0) {
                    const embed = new EmbedBuilder()
                        .setColor('#FFC0CB')
                        .setTitle('Matching Players')
                        .setDescription(`Search result for: **${playerName}**\nFound ${matchingPlayers.length} matching player(s).`)
                        .addFields(
                            matchingPlayers.map((player, index) => ({
                                name: `Player ${index + 1}`,
                                value: `**Name:** ${player.name}\n**ID:** ${player.id || 'N/A'}\n**Ping:** ${player.ping || 'N/A'} ms'}`,
                                inline: true
                            }))
                        )
                        .setThumbnail('https://i.imgur.com/wiDQQNA.png')
                        .setTimestamp();

                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.reply({ content: `No players found matching **${playerName}**.`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: 'Error: Players data is not in expected format.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error fetching player data:', error);
            await interaction.reply({ content: 'Error fetching player data. Please try again later.', ephemeral: true });
        }
    }
};