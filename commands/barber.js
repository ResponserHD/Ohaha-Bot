const { StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('barber')
        .setDescription('Track your customer as a hairstylist.')
        .addStringOption(option => 
            option.setName('customer_name')
                .setDescription("Customer's Name")
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('file')
                .setDescription("Image file for the proof")
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;
        const discordMention = `<@${userId}>`; // Mention format
        const customerName = interaction.options.getString('customer_name');
        const attachment = interaction.options.getAttachment('file');

        // Save user data temporarily
        const tempData = new Map();
        tempData.set(userId, { customerName, discordMention, imageUrl: attachment.url });

        // Prompt user to select services
        const servicesRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('service_selection')
                .setPlaceholder('Select services provided')
                .setMinValues(1)
                .setMaxValues(8)
                .addOptions([
                    { label: 'Hair', value: 'hair' },
                    { label: 'Hair Colour', value: 'hair_colour' },
                    { label: 'Make Up', value: 'make_up' },
                    { label: 'Lipstick', value: 'lipstick' },
                    { label: 'Blush On', value: 'blush_on' },
                    { label: 'Contact Lense', value: 'contact_lense' },
                    { label: 'Eyebrows', value: 'eyebrows' },
                    { label: 'Beard', value: 'beard' }
                ])
        );

        await interaction.reply({
            content: 'Please select the services provided:',
            components: [servicesRow],
            ephemeral: true
        });

        // Collector for service selection
        const serviceFilter = i => i.customId === 'service_selection' && i.user.id === userId;
        const serviceCollector = interaction.channel.createMessageComponentCollector({
            filter: serviceFilter,
            max: 1,
            time: 60000
        });

        serviceCollector.on('collect', async i => {
            const selectedServices = i.values;
            let totalPrice = 0;

            // Define the pricing rules
            const servicePrices = {
                hair: 15000,
                hair_colour: 15000,
                make_up: 7000,
                lipstick: 7000,
                blush_on: 7000,
                contact_lense: 20000,
                eyebrows: 10000,
                beard: 15000
            };

            const applyPricingRules = (services) => {
                const uniqueServices = new Set(services);
                let price = 0;

                if (uniqueServices.has('hair') && uniqueServices.has('hair_colour') && uniqueServices.size === 2) {
                    price = 25000; // Hair + Hair Colour
                } else if (uniqueServices.has('make_up') && uniqueServices.has('lipstick') && uniqueServices.has('blush_on') && uniqueServices.size === 3) {
                    price = 20000; // Make Up + Lipstick + Blush On
                } else if (uniqueServices.has('contact_lense') && uniqueServices.has('eyebrows') && uniqueServices.size === 2) {
                    price = 25000; // Contact Lense + Eyebrows
                } else if (uniqueServices.size === 8) {
                    price = 60000; // All services
                } else {
                    price = Array.from(uniqueServices).reduce((total, service) => total + (servicePrices[service] || 0), 0);
                }

                return price > 60000 ? 60000 : price; // Cap the total price at $60,000
            };

            totalPrice = applyPricingRules(selectedServices);
            const servicesDescription = selectedServices.map(service => 
                service.charAt(0).toUpperCase() + service.slice(1).replace('_', ' ')
            );

            const { customerName, discordMention, imageUrl } = tempData.get(userId);

            const previewEmbed = new EmbedBuilder()
                .setColor('#FFC0CB')
                .setTitle('Customer Details')
                .addFields(
                    { name: 'Customer', value: customerName },
                    { name: 'Hairstylist', value: discordMention }, // Mention the Discord user
                    { name: 'Services', value: servicesDescription.join(', ') },
                    { name: 'Total Price', value: `$${totalPrice.toLocaleString()}` }
                )
                .setImage(imageUrl);

            const confirmButton = new ButtonBuilder()
                .setCustomId('confirm_test')
                .setStyle(ButtonStyle.Success)
                .setLabel('Complete');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancel_test')
                .setStyle(ButtonStyle.Danger)
                .setLabel('Cancel');

            const actionRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            await i.update({
                content: 'Please confirm the details:',
                embeds: [previewEmbed],
                components: [actionRow]
            });

            // Collector for confirmation
            const finalFilter = i => ['confirm_test', 'cancel_test'].includes(i.customId) && i.user.id === userId;
            const finalCollector = interaction.channel.createMessageComponentCollector({
                filter: finalFilter,
                max: 1,
                time: 60000
            });

            finalCollector.on('collect', async i => {
                try {
                    if (i.customId === 'confirm_test') {
                        await i.update({
                            content: 'Details Confirmed!',
                            embeds: [],
                            components: [],
                            ephemeral: true // This ensures the ephemeral message is cleared out
                        });

                        await interaction.followUp({
                            content: '',
                            embeds: [previewEmbed],
                            components: [],
                            ephemeral: false // This ensures the message is public
                        });

                        tempData.delete(userId);
                    } else if (i.customId === 'cancel_test') {
                        await i.update({
                            content: 'The details have been canceled.',
                            embeds: [],
                            components: []
                        });
                        tempData.delete(userId);
                    }
                } catch (error) {
                    console.error('Error handling interaction:', error);
                    await i.reply({ content: 'There was an error while processing your request.', ephemeral: true });
                }
            });
        });
    }
};