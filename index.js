// npm install discord.js qrcode fs

const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const TOKEN = 'YOUR_TOKEN_HERE';
const QR_IMAGE_PATH = path.join(__dirname, 'qrcode.png');

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

    if (interaction.commandName === 'qr_menu') {
        await handleQrMenu(interaction);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && interaction.customId === 'qr_create') {
        await showQrModal(interaction);
    }

    if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'qr_modal') {
        await handleQrModalSubmit(interaction);
    }
});

async function handleQrMenu(interaction) {
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

async function showQrModal(interaction) {
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

async function handleQrModalSubmit(interaction) {
    const url = interaction.fields.getTextInputValue('url_input');

    try {
        const qrImage = await QRCode.toDataURL(url);
        const buffer = Buffer.from(qrImage.split(',')[1], 'base64');
        fs.writeFileSync(QR_IMAGE_PATH, buffer);

        await interaction.reply({
            files: [QR_IMAGE_PATH],
            ephemeral: true
        });

        fs.unlinkSync(QR_IMAGE_PATH);
    } catch (error) {
        console.error('Error generating QR code:', error);
        await interaction.reply({
            content: 'Failed to generate QR code.',
            ephemeral: true
        });
    }
}

client.login(TOKEN);
