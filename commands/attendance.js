const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('attendance')
		.setDescription('Mark your attendance by clicking the button'),
	async execute(interaction, client) {
		const userId = interaction.user.id; // The ID of the user who initiated the command
		const userMention = `<@${userId}>`; // Mention format for the user
		const attendees = new Map();

		// Function to create and return the button with the appropriate label
		const createButton = (label, customId) => {
			return new ButtonBuilder()
				.setCustomId(customId)
				.setStyle(ButtonStyle.Primary)
				.setLabel(label);
		};

		// Create the initial button
		const startButton = createButton('Start Attendance', 'start_attendance');

		const row = new ActionRowBuilder()
			.addComponents(startButton);

		const message = await interaction.reply({
			content: 'Click the button to mark your attendance!',
			components: [row],
		});

		const collector = message.createMessageComponentCollector({
			filter: i => i.customId === 'start_attendance' || i.customId === 'end_attendance',
		});

		collector.on('collect', async i => {
			if (i.user.id !== userId) {
				// If the interaction is not from the user who started the command, deny it
				await i.reply({ content: 'You are not authorized to interact with this button.', ephemeral: true });
				return;
			}

			const timestamp = new Date();

			if (i.customId === 'start_attendance') {
				if (attendees.has(userId)) {
					await i.reply({ content: 'You have already started your attendance!', ephemeral: true });
					return;
				}

				// User is starting their attendance
				attendees.set(userId, timestamp);

				const endButton = createButton('End Attendance', 'end_attendance');

				// Update button to "End Attendance"
				await i.update({
					content: 'You have marked the start of your attendance!',
					components: [new ActionRowBuilder().addComponents(endButton)],
				});
			} else if (i.customId === 'end_attendance') {
				if (!attendees.has(userId)) {
					await i.reply({ content: 'You have not started your attendance yet!', ephemeral: true });
					return;
				}

				// User is ending their attendance
				const startTime = attendees.get(userId);
				const durationMs = timestamp - startTime; // Duration in milliseconds

				// Convert duration to days, hours, minutes, and seconds
				const durationSec = Math.floor(durationMs / 1000);
				const days = Math.floor(durationSec / (24 * 3600));
				const hours = Math.floor((durationSec % (24 * 3600)) / 3600);
				const minutes = Math.floor((durationSec % 3600) / 60);
				const seconds = durationSec % 60;

				const formattedDuration = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;

				// Create an embed to show the total attendance
				const attendanceEmbed = new EmbedBuilder()
					.setColor('#FFC0CB') // Set color to pink
					.setTitle('Attendance Record')
					.setDescription(`Attendance record for ${userMention}`)
					.addFields(
						{ name: 'Start Time', value: startTime.toUTCString(), inline: true },
						{ name: 'End Time', value: timestamp.toUTCString(), inline: true },
						{ name: 'Total Duration', value: formattedDuration, inline: false },
					)
					.setTimestamp();

				await i.update({
					content: 'You have marked the end of your attendance.',
					embeds: [attendanceEmbed],
					components: [], // Remove the button after attendance is ended
				});

				attendees.delete(userId); // Remove user after they finish their attendance
				collector.stop(); // Stop the collector to prevent further interaction
			}
		});
	},
};