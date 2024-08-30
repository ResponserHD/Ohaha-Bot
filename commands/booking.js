const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bookhaircut')
        .setDescription('Book a haircut appointment by providing your name, time slot, and additional details.'),
    async execute(interaction, client) {
        const userId = interaction.user.id;
        const appointments = new Map();
        const tempData = new Map();
        const messageCache = new Map(); // Cache for storing message IDs

        const introEmbed = new EmbedBuilder()
            .setColor('#FFC0CB')
            .setTitle('Haircut Appointment Booking')
            .setDescription('To start the booking process, click the button below.')
            .setThumbnail('https://i.imgur.com/4MIYt7t.png')
            .setFooter({ text: 'We look forward to seeing you!', iconURL: 'https://example.com/icon.png' });

        const startButton = new ButtonBuilder()
            .setCustomId('start_booking')
            .setStyle(ButtonStyle.Primary)
            .setLabel('🗓️ Create Booking');

        const row = new ActionRowBuilder().addComponents(startButton);

        const reply = await interaction.reply({
            embeds: [introEmbed],
            components: [row],
            fetchReply: true
        });

        // Store the message ID of the initial reply
        messageCache.set(userId, reply.id);

        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'start_booking' || i.customId === 'confirm_booking' || i.customId === 'cancel_booking',
            time: 60000,
        });

        collector.on('collect', async i => {
            if (i.customId === 'start_booking') {
                const modal = new ModalBuilder()
                    .setCustomId('appointment_modal')
                    .setTitle('Appointment Details');

                const nameInput = new TextInputBuilder()
                    .setCustomId('user_name')
                    .setLabel("What's your name?")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const timeInput = new TextInputBuilder()
                    .setCustomId('appointment_time')
                    .setLabel('Enter the time (e.g., 10:00)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const detailsInput = new TextInputBuilder()
                    .setCustomId('additional_details')
                    .setLabel('Any additional details or requests?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(nameInput),
                    new ActionRowBuilder().addComponents(timeInput),
                    new ActionRowBuilder().addComponents(detailsInput)
                );

                await i.showModal(modal);
            }
        });

        client.on('interactionCreate', async (interaction) => {
            if (interaction.isModalSubmit() && interaction.customId === 'appointment_modal') {
                try {
                    await interaction.deferReply(); // Defer the reply to handle later

                    const name = interaction.fields.getTextInputValue('user_name');
                    const timeInput = interaction.fields.getTextInputValue('appointment_time');
                    const additionalDetails = interaction.fields.getTextInputValue('additional_details') || 'No additional details provided.';

                    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)$/;
                    if (!timeRegex.test(timeInput)) {
                        await interaction.followUp({
                            content: 'Invalid time format. Please enter the time in 12-hour format (e.g., 10:00).',
                            ephemeral: true,
                        });
                        return;
                    }

                    tempData.set(userId, { name, timeInput, additionalDetails });

                    const timeChoiceRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('time_choice')
                            .setPlaceholder('Choose AM or PM')
                            .addOptions(
                                { label: 'AM', value: 'AM' },
                                { label: 'PM', value: 'PM' }
                            )
                    );

                    await interaction.followUp({
                        content: 'Please select AM or PM for your appointment time:',
                        components: [timeChoiceRow],
                    });
                } catch (error) {
                    console.error('Error handling modal submit:', error);
                }
            } else if (interaction.isStringSelectMenu() && interaction.customId === 'time_choice') {
                try {
                    const timePeriod = interaction.values[0];
                    const data = tempData.get(userId);
                    if (!data) {
                        await interaction.reply({
                            content: 'No appointment data found.',
                            ephemeral: true,
                        });
                        return;
                    }

                    const { name, timeInput, additionalDetails } = data;
                    const fullTime = `${timeInput} ${timePeriod}`;

                    appointments.set(userId, { name, fullTime, additionalDetails });

                    const bookingEmbed = new EmbedBuilder()
                        .setColor('#FFC0CB')
                        .setTitle('Appointment Confirmation')
                        .addFields(
                            { name: 'Name', value: name, inline: true },
                            { name: 'Appointment Time', value: fullTime, inline: true },
                            { name: 'Additional Details', value: additionalDetails, inline: false }
                        )
                        .setThumbnail('https://i.imgur.com/4MIYt7t.png')
                        .setTimestamp();

                    const confirmButton = new ButtonBuilder()
                        .setCustomId('confirm_booking')
                        .setStyle(ButtonStyle.Success)
                        .setLabel('Confirm Booking');

                    const cancelButton = new ButtonBuilder()
                        .setCustomId('cancel_booking')
                        .setStyle(ButtonStyle.Danger)
                        .setLabel('Cancel Booking');

                    const confirmRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

                    // Delete previous messages
                    const previousMessageId = messageCache.get(userId);
                    if (previousMessageId) {
                        try {
                            const previousMessage = await interaction.channel.messages.fetch(previousMessageId);
                            await previousMessage.delete();
                        } catch (error) {
                            console.error('Error deleting previous message:', error);
                        }
                    }

                    // Update with the new booking embed
                    const newMessage = await interaction.update({
                        content: 'Please confirm the appointment details:',
                        embeds: [bookingEmbed],
                        components: [confirmRow],
                    });

            
                    // Cache the ID of the new message
                    messageCache.set(userId, newMessage.id);

                    tempData.delete(userId);
                } catch (error) {
                    console.error('Error handling select menu interaction:', error);
                }
            }
        });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_booking') {
                try {
                    const appointment = appointments.get(userId);

                    if (!appointment) {
                        await i.reply({
                            content: 'No appointment found to confirm.',
                            ephemeral: true,
                        });
                        return;
                    }

                    const finalEmbed = new EmbedBuilder()
                        .setColor('#FFC0CB')
                        .setTitle('Appointment Confirmed')
                        .setDescription(`Your appointment with ${appointment.name} is confirmed at ${appointment.fullTime}.`)
                        .addFields({ name: 'Additional Details', value: appointment.additionalDetails })
                        .setThumbnail('https://i.imgur.com/4MIYt7t.png')
                        .setTimestamp()
                        .setFooter({ text: 'Thank you for booking with us!', iconURL: 'https://example.com/footer-icon.png' });

                    await i.update({
                        content: 'The haircut appointment is confirmed!',
                        embeds: [finalEmbed],
                        components: [],
                    });

                    // Send the booking details to the specified channel
                    const channel = await client.channels.fetch('1279019236865478728');
                    if (channel) {
                        await channel.send({ embeds: [finalEmbed] });
                    }

                    // Clear all stored message IDs
                    messageCache.clear();
                    appointments.delete(userId);
                    collector.stop();

                    // Attempt to delete the confirmation message
                    try {
                        const confirmationMessage = await interaction.channel.messages.fetch(messageCache.get(userId));
                        await confirmationMessage.delete();
                    } catch (error) {
                        console.error('Error deleting confirmation message:', error);
                    }
                } catch (error) {
                    console.error('Error confirming booking:', error);
                }
            } else if (i.customId === 'cancel_booking') {
                try {
                    await i.update({
                        content: 'The booking has been canceled.',
                        embeds: [],
                        components: [],
                    });

                    // Clear all stored message IDs
                    messageCache.clear();
                    appointments.delete(userId);
                    collector.stop();

                    // Attempt to delete the confirmation message
                    try {
                        const confirmationMessage = await interaction.channel.messages.fetch(messageCache.get(userId));
                        await confirmationMessage.delete();
                    } catch (error) {
                        console.error('Error deleting confirmation message:', error);
                    }
                } catch (error) {
                    console.error('Error canceling booking:', error);
                }
            }
        });
    },
};