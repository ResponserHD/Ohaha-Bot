const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('price')
        .setDescription('Sends the beauty services prices'),
    async execute(interaction, client) {
        const embed = {
            setcolor: ('#FFC0CB'), // Use your preferred hex color
            title: ("Ohaha-Yi L'Art Du Style Prices"),
            fields: [
                {
                    name: 'Hair',
                    value: '15,000',
                    inline: true
                },
                {
                    name: 'Hair Colour',
                    value: '15,000',
                    inline: true
                },
                {
                    name: 'Hair + Hair Colour',
                    value: '25,000 only',
                    inline: true
                },
                {
                    name: 'Make Up',
                    value: '7,000',
                    inline: true
                },
                {
                    name: 'Lipstick',
                    value: '7,000',
                    inline: true
                },
                {
                    name: 'Blush On',
                    value: '7,000',
                    inline: true
                },
                {
                    name: 'Make Up + Lipstick + Blush On',
                    value: '20,000',
                    inline: true
                },
                {
                    name: 'Contanct Lense',
                    value: '20,000',
                    inline: true
                },
                {
                    name: 'Eyebrows',
                    value: '10,000',
                    inline: true
                },
                {
                    name: 'Contact Lense & Eyebrows',
                    value: '25,000',
                    inline: true
                },
                {
                    name: 'Beard',
                    value: '15,000',
                    inline: true
                },
                {
                    name: 'Full Package',
                    value: '60,000',
                    inline: true
                }
            ],
        };

        await interaction.reply({ embeds: [embed] });
    }
};