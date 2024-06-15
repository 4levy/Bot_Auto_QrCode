//npm install discord.js qrcode fs

const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const QRCode = require('qrcode');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const TOKEN = 'UR TOKEnn';

client.once('ready', () => {
    console.log('Started');
    client.guilds.cache.forEach(guild => {
        guild.commands.create({
            name: 'qr_menu',
            description: 'Generate QR Code'
        });
    });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'qr_menu') {
        const embed = new EmbedBuilder()
            .setTitle('ระบบคิวอาร์โค้ด | Qr Code Generator')
            .setDescription('```กดปุ่มด้านล่างเพื่อทำการสร้างคิวอาร์โค้ด.```')
            .setColor(0x00AE86);

        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('qr_create')
                    .setLabel('Create QR Code')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [button] });
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'qr_create') {
        const modal = new ModalBuilder()
            .setCustomId('qr_modal')
            .setTitle('QR Code Generator');

        const urlInput = new TextInputBuilder()
            .setCustomId('url_input')
            .setLabel('ใส่ลิ้งค์ในช่องด้านล่าง')
            .setPlaceholder('ลิ้ง | Url')
            .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(urlInput);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
    }

    if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'qr_modal') {
            const url = interaction.fields.getTextInputValue('url_input');
            try {
                const qrImage = await QRCode.toDataURL(url);
                const buffer = Buffer.from(qrImage.split(',')[1], 'base64');
                fs.writeFileSync('qrcode.png', buffer);

                await interaction.reply({
                    files: ['qrcode.png'],
                    ephemeral: true
                });
                
                fs.unlinkSync('qrcode.png');
            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: 'Failed to generate QR code.',
                    ephemeral: true
                });
            }
        }
    }
});

client.login(TOKEN);
